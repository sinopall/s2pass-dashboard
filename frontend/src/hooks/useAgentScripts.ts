import { useEffect, useState } from "react";
import { fetchMyScript, updateMyScriptContent } from "./../api/scriptApi";
import { ScriptContent } from "./../types/script.types";
import { defaultScripts } from "../constants/constants";

export function useAgentScripts() {
  const [isLoading, setIsLoading] = useState(true);
  const [scripts, setScripts] = useState<ScriptContent | null>(defaultScripts);

  const fetchScript = async () => {
    try {
      setIsLoading(true);
      const response = await fetchMyScript();
      if (response && response.content && response.content.flow_steps) {
        setScripts(response.content);
      }
    } catch (error) {
      console.error("Gagal load script:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateScript = async (
    stepKey: keyof ScriptContent["flow_steps"],
    newText: string,
  ) => {
    const updatedContent: ScriptContent = {
      ...scripts,
      flow_steps: {
        ...scripts!.flow_steps,
        [stepKey]: newText,
      },
    };

    await updateMyScriptContent(updatedContent);
    setScripts(updatedContent);
  };

  useEffect(() => {
    fetchScript();
  }, []);

  return { isLoading, scripts, handleUpdateScript };
}
