package handlers

import (
	"bytes"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"time"
	"unicode"

	"github.com/gin-gonic/gin"
)

// ==================== STRUCTS ====================

type DocxAccordion struct {
	Title    string `json:"title"`
	BodyHTML string `json:"body_html"`
}

type DocxTab struct {
	Title      string          `json:"title"`
	Accordions []DocxAccordion `json:"accordions"`
}

type DocxImportResult struct {
	Title            string    `json:"title"`
	SuggestedSlug    string    `json:"suggested_slug"`
	Tabs             []DocxTab `json:"tabs"`
	RawHTML          string    `json:"raw_html"`
	Strategy         string    `json:"strategy"`
	OriginalFileName string    `json:"original_file_name"`
	OriginalFileURL  string    `json:"original_file_url"`
	OriginalFileSize int64     `json:"original_file_size"`
}

// ==================== HANDLER ====================

type DocxImportHandler struct{}

func NewDocxImportHandler() *DocxImportHandler { return &DocxImportHandler{} }

func (h *DocxImportHandler) Import(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file .docx wajib diupload"})
		return
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".docx" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "hanya file .docx yang didukung"})
		return
	}

	// Simpan file ASLI secara permanen ke ./uploads (supaya bisa di-attach ke produk nanti)
	_ = os.MkdirAll("./uploads", 0755)
	storedName := fmt.Sprintf("%s_%s", time.Now().Format("20060102_150405"), strings.ReplaceAll(file.Filename, " ", "_"))
	permPath := filepath.Join("./uploads", storedName)

	if err := c.SaveUploadedFile(file, permPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "gagal menyimpan file"})
		return
	}

	// Convert ke HTML via pandoc (pakai file yang baru disimpan)
	rawHTML, err := convertDocxToHTML(permPath)
	if err != nil {
		// gagal parse -> hapus file yang sudah terlanjur disimpan
		_ = os.Remove(permPath)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "gagal konversi docx: " + err.Error()})
		return
	}

	// Parse HTML → tabs + accordions
	result := parseHTMLToTabs(rawHTML, file.Filename)
	result.OriginalFileName = file.Filename
	result.OriginalFileURL = "/uploads/" + storedName
	result.OriginalFileSize = file.Size

	c.JSON(http.StatusOK, result)
}

// ==================== CONVERSION ====================

func convertDocxToHTML(path string) (string, error) {
	cmd := exec.Command("pandoc", path, "-t", "html", "--no-highlight")
	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("pandoc error: %s", stderr.String())
	}
	return out.String(), nil
}

// ==================== PARSER ====================

// Strategi parsing:
// 1. Jika ada H1 → H1 jadi title produk, H2 jadi tab, H3 jadi accordion
// 2. Jika hanya H2 (no H1) → H2 jadi accordion dalam 1 tab "Default"
// 3. Jika tidak ada heading → semua jadi 1 accordion "Isi Dokumen" dalam 1 tab "Default"

type htmlBlock struct {
	tag     string // "h1","h2","h3","body"
	content string
}

func parseHTMLToTabs(rawHTML, filename string) DocxImportResult {
	blocks := splitHTMLByHeadings(rawHTML)

	title := extractTitleFromFilename(filename)
	var tabs []DocxTab
	strategy := ""

	hasH1 := false
	hasH2 := false
	hasH3 := false

	for _, b := range blocks {
		switch b.tag {
		case "h1":
			hasH1 = true
		case "h2":
			hasH2 = true
		case "h3":
			hasH3 = true
		}
	}

	_ = hasH3

	if hasH1 && hasH2 {
		// Strategi A: H1=title, H2=tab, H3/body=accordion
		strategy = "h1_title_h2_tabs"
		tabs = parseStrategyA(blocks, &title)
	} else if hasH2 {
		// Strategi B: H2=accordion, semua dalam 1 tab
		strategy = "h2_accordions"
		tabs = parseStrategyB(blocks)
	} else if hasH1 {
		// Strategi C: H1=accordion judul, body=isi
		strategy = "h1_accordions"
		tabs = parseStrategyC(blocks, &title)
	} else {
		// Strategi D: tidak ada heading, semua jadi 1 accordion
		strategy = "flat"
		tabs = parseStrategyD(rawHTML)
	}

	// Pastikan tidak ada tab/accordion kosong
	tabs = cleanupTabs(tabs)

	return DocxImportResult{
		Title:         title,
		SuggestedSlug: slugify(title),
		Tabs:          tabs,
		RawHTML:       rawHTML,
		Strategy:      strategy,
	}
}

// splitHTMLByHeadings memecah HTML menjadi blok berdasarkan tag heading
func splitHTMLByHeadings(html string) []htmlBlock {
	var blocks []htmlBlock

	// Regex untuk match semua heading tags
	headingRe := regexp.MustCompile(`(?i)<(h[1-6])[^>]*>(.*?)</h[1-6]>`)

	// Split by headings - cari posisi setiap heading
	type match struct {
		start, end int
		tag        string
		text       string
	}

	matches := headingRe.FindAllStringSubmatchIndex(html, -1)
	headingMatches := headingRe.FindAllStringSubmatch(html, -1)

	if len(matches) == 0 {
		// Tidak ada heading
		blocks = append(blocks, htmlBlock{tag: "body", content: html})
		return blocks
	}

	// Content sebelum heading pertama
	if matches[0][0] > 0 {
		pre := strings.TrimSpace(html[:matches[0][0]])
		if pre != "" {
			blocks = append(blocks, htmlBlock{tag: "body", content: pre})
		}
	}

	for i, m := range matches {
		tag := strings.ToLower(headingMatches[i][1])
		headingText := stripHTML(headingMatches[i][2])

		blocks = append(blocks, htmlBlock{tag: tag, content: headingText})

		// Body content antara heading ini dan heading berikutnya
		bodyStart := m[1]
		bodyEnd := len(html)
		if i+1 < len(matches) {
			bodyEnd = matches[i+1][0]
		}

		body := strings.TrimSpace(html[bodyStart:bodyEnd])
		if body != "" {
			blocks = append(blocks, htmlBlock{tag: "body", content: body})
		}
	}

	return blocks
}

// Strategi A: H1=product title, H2=tab name, H3+body=accordion
func parseStrategyA(blocks []htmlBlock, title *string) []DocxTab {
	var tabs []DocxTab
	var currentTab *DocxTab
	var currentAccTitle string
	var currentAccBody strings.Builder

	flushAcc := func() {
		if currentTab == nil {
			return
		}
		body := strings.TrimSpace(currentAccBody.String())
		if currentAccTitle != "" {
			currentTab.Accordions = append(currentTab.Accordions, DocxAccordion{
				Title:    currentAccTitle,
				BodyHTML: body,
			})
		} else if body != "" {
			// body tanpa judul accordion → tambah ke accordion terakhir atau buat baru
			if len(currentTab.Accordions) > 0 {
				last := &currentTab.Accordions[len(currentTab.Accordions)-1]
				last.BodyHTML += body
			} else {
				currentTab.Accordions = append(currentTab.Accordions, DocxAccordion{
					Title:    currentTab.Title,
					BodyHTML: body,
				})
			}
		}
		currentAccTitle = ""
		currentAccBody.Reset()
	}

	flushTab := func() {
		flushAcc()
		if currentTab != nil {
			tabs = append(tabs, *currentTab)
			currentTab = nil
		}
	}

	for _, b := range blocks {
		switch b.tag {
		case "h1":
			*title = b.content
		case "h2":
			flushTab()
			currentTab = &DocxTab{Title: b.content, Accordions: []DocxAccordion{}}
		case "h3":
			if currentTab == nil {
				currentTab = &DocxTab{Title: "Informasi", Accordions: []DocxAccordion{}}
			}
			flushAcc()
			currentAccTitle = b.content
		case "body":
			if currentTab == nil {
				currentTab = &DocxTab{Title: "Informasi", Accordions: []DocxAccordion{}}
			}
			if currentAccTitle == "" && len(currentTab.Accordions) == 0 {
				// Body langsung setelah H2, buat accordion dengan nama tab
				currentAccTitle = currentTab.Title
			}
			currentAccBody.WriteString(b.content)
		}
	}

	flushTab()
	return tabs
}

// Strategi B: H2=accordion dalam 1 tab Default
func parseStrategyB(blocks []htmlBlock) []DocxTab {
	tab := DocxTab{Title: "Informasi", Accordions: []DocxAccordion{}}
	var currentTitle string
	var currentBody strings.Builder

	flush := func() {
		body := strings.TrimSpace(currentBody.String())
		if currentTitle != "" {
			tab.Accordions = append(tab.Accordions, DocxAccordion{
				Title:    currentTitle,
				BodyHTML: body,
			})
		} else if body != "" {
			tab.Accordions = append(tab.Accordions, DocxAccordion{
				Title:    "Isi Dokumen",
				BodyHTML: body,
			})
		}
		currentTitle = ""
		currentBody.Reset()
	}

	for _, b := range blocks {
		switch b.tag {
		case "h2":
			flush()
			currentTitle = b.content
		case "h3":
			// treat H3 sebagai bagian dari body accordion H2 saat ini
			if currentTitle != "" {
				currentBody.WriteString(fmt.Sprintf("<h3>%s</h3>", b.content))
			} else {
				flush()
				currentTitle = b.content
			}
		case "body":
			currentBody.WriteString(b.content)
		}
	}

	flush()
	return []DocxTab{tab}
}

// Strategi C: H1=accordion title, body=isi
func parseStrategyC(blocks []htmlBlock, title *string) []DocxTab {
	tab := DocxTab{Title: "Informasi", Accordions: []DocxAccordion{}}
	var currentTitle string
	var currentBody strings.Builder
	first := true

	flush := func() {
		body := strings.TrimSpace(currentBody.String())
		t := currentTitle
		if t == "" {
			t = "Isi Dokumen"
		}
		tab.Accordions = append(tab.Accordions, DocxAccordion{
			Title:    t,
			BodyHTML: body,
		})
		currentTitle = ""
		currentBody.Reset()
	}

	for _, b := range blocks {
		switch b.tag {
		case "h1":
			if first {
				*title = b.content
				first = false
			} else {
				if currentBody.Len() > 0 {
					flush()
				}
				currentTitle = b.content
			}
		case "body":
			currentBody.WriteString(b.content)
		}
	}

	if currentBody.Len() > 0 {
		flush()
	}

	return []DocxTab{tab}
}

// Strategi D: flat, semua jadi 1 accordion
func parseStrategyD(rawHTML string) []DocxTab {
	return []DocxTab{
		{
			Title: "Informasi",
			Accordions: []DocxAccordion{
				{
					Title:    "Isi Dokumen",
					BodyHTML: strings.TrimSpace(rawHTML),
				},
			},
		},
	}
}

// ==================== HELPERS ====================

func cleanupTabs(tabs []DocxTab) []DocxTab {
	var result []DocxTab
	for _, t := range tabs {
		if strings.TrimSpace(t.Title) == "" {
			t.Title = "Informasi"
		}
		var accs []DocxAccordion
		for _, a := range t.Accordions {
			if strings.TrimSpace(a.Title) == "" {
				a.Title = "Isi"
			}
			if strings.TrimSpace(a.BodyHTML) == "" {
				a.BodyHTML = "<p>-</p>"
			}
			accs = append(accs, a)
		}
		if len(accs) == 0 {
			accs = []DocxAccordion{{Title: t.Title, BodyHTML: "<p>-</p>"}}
		}
		t.Accordions = accs
		result = append(result, t)
	}
	if len(result) == 0 {
		result = []DocxTab{
			{
				Title:      "Informasi",
				Accordions: []DocxAccordion{{Title: "Isi Dokumen", BodyHTML: "<p>-</p>"}},
			},
		}
	}
	return result
}

func stripHTML(s string) string {
	re := regexp.MustCompile(`<[^>]+>`)
	return strings.TrimSpace(re.ReplaceAllString(s, ""))
}

func extractTitleFromFilename(filename string) string {
	base := filepath.Base(filename)
	ext := filepath.Ext(base)
	name := strings.TrimSuffix(base, ext)
	// Replace underscores/dashes with spaces
	name = strings.ReplaceAll(name, "_", " ")
	name = strings.ReplaceAll(name, "-", " ")
	// Title case
	words := strings.Fields(name)
	for i, w := range words {
		if len(w) > 0 {
			words[i] = strings.ToUpper(w[:1]) + w[1:]
		}
	}
	return strings.Join(words, " ")
}

var reNonSlugGo = regexp.MustCompile(`[^a-z0-9\s-]+`)
var reSpacesGo = regexp.MustCompile(`\s+`)
var reDashGo = regexp.MustCompile(`-+`)

func slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	// Remove non-ascii letters carefully - keep alphanumeric, spaces, hyphens
	var b strings.Builder
	for _, r := range s {
		if unicode.IsLetter(r) || unicode.IsDigit(r) || r == ' ' || r == '-' {
			b.WriteRune(r)
		}
	}
	s = b.String()
	s = reSpacesGo.ReplaceAllString(s, "-")
	s = reDashGo.ReplaceAllString(s, "-")
	s = strings.Trim(s, "-")
	return s
}
