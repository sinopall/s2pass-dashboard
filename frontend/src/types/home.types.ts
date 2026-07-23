// ===== Types =====
export type RootType = "Informasi" | "Request" | "Complaint";

export interface CategoryNode {
  id: number;
  name: string;
  parent_id?: number | null;
  level?: number;
  children?: CategoryNode[];
}

export type PageKey = "wizard" | "category";

export type DetailKind = "product" | "script";

// ===== Global search types =====
export type KnowledgeItem = {
  id: number;
  title: string;
  slug: string;
  type: "product" | "script";
  category_name: string;
  updated_at: string;
};
