import { updateActionProperty } from "actions/pluginActionActions";
import ActionAPI from "api/ActionAPI";
import type { VisualizationElements } from "entities/Action";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";

export const useSaveVisualization = (actionId: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const dispatch = useDispatch();

  const execute = useCallback(
    async (elements: VisualizationElements) => {
      setIsLoading(true);
      setHasError(false);

      try {
        const response = await ActionAPI.saveVisualization(actionId, elements);

        dispatch(
          updateActionProperty({
            id: actionId,
            field: "visualization",
            value: response.data,
          }),
        );
      } catch (error) {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    },
    [actionId],
  );

  return {
    execute,
    isLoading,
    hasError,
  };
};
