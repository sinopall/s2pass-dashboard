// Tipe data node kategori
export interface CategoryNode {
  id: number;
  name: string;
  children?: CategoryNode[];
}

// Tipe data kategori yang sudah didatarkan (ada depth-nya)
export interface FlatCategory {
  id: number;
  name: string;
  depth: number;
}

// Fungsi Rekursif: Mengubah Tree menjadi Flat Array
export const flattenCategoryTree = (
  nodes: CategoryNode[],
  depth: number = 0,
  result: FlatCategory[] = [],
): FlatCategory[] => {
  nodes.forEach((node) => {
    // 1. Masukkan node saat ini ke result
    result.push({ id: node.id, name: node.name, depth });

    // 2. Jika punya anak, panggil fungsi ini lagi (rekursif) dengan depth + 1
    if (node.children && node.children.length > 0) {
      flattenCategoryTree(node.children, depth + 1, result);
    }
  });

  return result;
};
