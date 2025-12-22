export interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  level: number;
  children: Category[];
}