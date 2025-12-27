export interface Product {
  id: number;
  title: string;
  slug: string;
  category_id: number;
  is_breaking: boolean;
  content: any;
  updated_at: string;
}

export interface Script extends Product {
}