import ActionAPI from "api/ActionAPI";
import type { VisualizationElements } from "entities/Action";
import { useCallback, useEffect, useState } from "react";

export const useGenerateVisualization = (
  actionId: string,
  elements?: VisualizationElements,
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [results, setResults] = useState<VisualizationElements[]>(
    elements ? [elements] : [],
  );
  const [currIndex, setCurrIndex] = useState(0);

  const clampIndex = useCallback(
    (index: number) => {
      return Math.max(0, Math.min(index, results.length - 1));
    },
    [results],
  );

  useEffect(
    function updateCurrIndex() {
      setCurrIndex(clampIndex(results.length - 1));
    },
    [results, clampIndex, setCurrIndex],
  );

  const execute = useCallback(
    async (prompt: string, data: unknown) => {
      setIsLoading(true);
      setHasError(false);

      try {
        const response = await ActionAPI.generateVisualization(
          actionId,
          prompt,
          data,
        );

        setResults((result) => [
          ...result,
          {
            js: response.data.result.js,
            css: response.data.result.css,
            html: response.data.result.html,
          },
        ]);
      } catch (error) {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    },
    [actionId],
  );

  const previous = useCallback(() => {
    setCurrIndex((i) => clampIndex(i - 1));
  }, [clampIndex, setCurrIndex]);

  const next = useCallback(() => {
    setCurrIndex((i) => clampIndex(i + 1));
  }, [clampIndex, setCurrIndex]);

  return {
    execute,
    isLoading,
    hasError,
    elements: results.length > 0 ? results[currIndex] : undefined,
    hasPrevious: currIndex > 0,
    hasNext: currIndex < results.length - 1,
    previous,
    next,
  };
};
