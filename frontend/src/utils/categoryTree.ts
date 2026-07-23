import { CategoryNode, RootType } from "./../types/home.types";

export function findNodeById(
  tree: CategoryNode[],
  id: number,
): CategoryNode | null {
  for (const n of tree) {
    if (n.id === id) return n;
    if (n.children?.length) {
      const f = findNodeById(n.children, id);
      if (f) return f;
    }
  }
  return null;
}

export function findRootTypeByNodeName(name: string): RootType | null {
  if (name === "Informasi") return "Informasi";
  if (name === "Request") return "Request";
  if (name === "Complaint") return "Complaint";
  return null;
}
