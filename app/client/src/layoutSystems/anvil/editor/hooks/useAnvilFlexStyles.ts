import { useWidgetBorderStyles } from "layoutSystems/anvil/common/hooks/useWidgetBorderStyles";
import { useEffect, useMemo } from "react";
import { isWidgetSelected } from "selectors/widgetSelectors";
import { useSelector } from "react-redux";
import type { AppState } from "@appsmith/reducers";

export const useAnvilFlexStyles = (
  widgetId: string,
  widgetName: string,
  isVisible = true,
  ref: React.RefObject<HTMLDivElement>,
) => {
  // add border styles to the widget
  const borderStyles = useWidgetBorderStyles(widgetId);
  useEffect(() => {
    Object.entries(borderStyles).forEach(([property, value]) => {
      if (ref.current) {
        ref.current.style[property as any] = value;
      }
    });
  }, [borderStyles]);

  useEffect(() => {
    if (ref.current) {
      ref.current.setAttribute("data-widgetname-cy", widgetName);
    }
  }, [widgetName]);
  const isSelected = useSelector(isWidgetSelected(widgetId));
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );
  const shouldFadeWidget = (isDragging && isSelected) || !isVisible;
  const opacityFactor = useMemo(() => {
    return shouldFadeWidget ? 0.5 : 1;
  }, [shouldFadeWidget]);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.opacity = opacityFactor.toString();
    }
  }, [opacityFactor]);
};
