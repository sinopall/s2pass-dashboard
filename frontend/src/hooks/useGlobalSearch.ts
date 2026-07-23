import { useEffect, useRef, useState } from "react";
import axios from "./../api/axios";
import { KnowledgeItem } from "../types/home.types.ts";

export function useGlobalSearch() {
  const [globalQ, setGlobalQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [searchItems, setSearchItems] = useState<KnowledgeItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  // close dropdown search saat klik di luar
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!searchBoxRef.current) return;
      if (!searchBoxRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // debounce global search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(globalQ.trim()), 350);
    return () => clearTimeout(t);
  }, [globalQ]);

  // fetch global search
  useEffect(() => {
    const q = debouncedQ;
    if (!q) {
      setSearchItems([]);
      return;
    }
    (async () => {
      setSearchLoading(true);
      try {
        const res = await axios.get("/knowledge-base/all", {
          params: { q, page: 1, limit: 8 },
        });
        setSearchItems(res.data?.items || []);
      } catch {
        setSearchItems([]);
      } finally {
        setSearchLoading(false);
      }
    })();
  }, [debouncedQ]);

  const resetSearch = () => {
    setGlobalQ("");
    setSearchItems([]);
    setSearchOpen(false);
  };

  return {
    globalQ,
    setGlobalQ,
    searchItems,
    searchLoading,
    searchOpen,
    setSearchOpen,
    searchBoxRef,
    resetSearch,
  };
}
