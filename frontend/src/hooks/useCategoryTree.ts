import { useEffect, useMemo, useState } from "react";
import axios from "./../api/axios";
import API from "./../api/api";
import { CategoryNode } from "../types/home.types";
import { rootOrder } from "../constants/constants";
import { findNodeById } from "../utils/categoryTree";

export function useCategoryTree() {
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState("");
  const [catStack, setCatStack] = useState<number[]>([]);

  useEffect(() => {
    (async () => {
      setCatLoading(true);
      setCatError("");
      try {
        const res = await axios.get(API.categories.tree);
        setTree(res.data || []);
      } catch {
        setCatError("Gagal memuat kategori.");
      } finally {
        setCatLoading(false);
      }
    })();
  }, []);

  const rootMap = useMemo(() => {
    const map: Record<string, CategoryNode> = {};
    for (const n of tree) map[n.name] = n;
    return map;
  }, [tree]);

  const currentCategoryNode = useMemo(() => {
    if (catStack.length === 0) return null;
    return findNodeById(tree, catStack[catStack.length - 1]);
  }, [tree, catStack]);

  const currentButtons = useMemo(() => {
    if (catStack.length === 0) {
      return rootOrder.map((r) => rootMap[r]).filter(Boolean) as CategoryNode[];
    }
    return currentCategoryNode?.children || [];
  }, [catStack, currentCategoryNode, rootMap]);

  const breadcrumb = useMemo(() => {
    if (catStack.length === 0) return [];
    const nodes: CategoryNode[] = [];
    for (const id of catStack) {
      const n = findNodeById(tree, id);
      if (n) nodes.push(n);
    }
    return nodes;
  }, [catStack, tree]);

  const isLeafScreen =
    catStack.length > 0 && (currentCategoryNode?.children?.length || 0) === 0;

  const onCategoryClick = (node: CategoryNode) => {
    setCatStack((prev) => [...prev, node.id]);
  };

  const popCategoryStack = () => {
    setCatStack((p) => p.slice(0, -1));
  };

  return {
    tree,
    catLoading,
    catError,
    catStack,
    setCatStack,
    currentCategoryNode,
    currentButtons,
    breadcrumb,
    isLeafScreen,
    onCategoryClick,
    popCategoryStack,
  };
}
