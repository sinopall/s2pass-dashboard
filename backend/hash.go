package main

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	hash := "$2b$12$ODZuSy07obkh0tN3ZdOPN.u387/8NGvDeBssA26ciJoElM9p9sEcu"

	candidates := []string{
		"admin1234",
		"admin123",
		"admin12345",
		"password123",
		"12345678",
		"admin",
		// tambah tebakan kamu di sini
	}

	for _, p := range candidates {
		err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(p))
		if err == nil {
			fmt.Println("MATCH:", p)
			return
		}
	}
	fmt.Println("No match in candidates")
}
