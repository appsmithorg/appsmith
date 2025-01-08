import { useCallback } from "react";
import type { MouseEvent } from "react";
import type { WidgetType } from "constants/WidgetConstants";

interface HandlerConfig {
  switchToWidget: (widgetId: string) => void;
  enterEditMode: (widgetId: string) => void;
}

export const useWidgetTreeHandlers = (config: HandlerConfig) => {
  const { enterEditMode, switchToWidget } = config;

  const handleClick = useCallback(
    (_e: MouseEvent, widgetId: string) => {
      switchToWidget(widgetId);
    },
    [switchToWidget],
  );

  const handleDoubleClick = useCallback(
    (widgetId: string) => {
      enterEditMode(widgetId);
    },
    [enterEditMode],
  );

  return {
    handleClick,
    handleDoubleClick,
  };
};
