import { useState, useEffect } from "react";
import PageMeta from "../../../components/common/PageMeta";
import ProductList from "../Product/ProductList";
import KnowledgeList from "./KnowledgeList";

export default function KnowledgeBasePage() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user_data");
    if (stored) {
      const user = JSON.parse(stored);
      setIsAdmin(user.role === "admin");
    }
  }, []);

  return (
    <>
      <PageMeta title="Knowledge Base | S2PAS" description="" />

      {isAdmin ? (
        <div className="animate-in fade-in duration-300">
          <ProductList />
        </div>
      ) : (
        <div className="animate-in fade-in duration-300">
          <KnowledgeList />
        </div>
      )}
    </>
  );
}
