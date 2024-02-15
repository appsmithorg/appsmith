import { useEffect, useMemo } from "react";
import { isWidgetSelected } from "selectors/widgetSelectors";
import { useSelector } from "react-redux";
import { useWidgetBorderStyles } from "layoutSystems/anvil/common/hooks/useWidgetBorderStyles";
import type { AppState } from "@appsmith/reducers";

export const useAnvilWidgetStyles = (
  widgetId: string,
  widgetName: string,
  isVisible = true,
  ref: React.RefObject<HTMLDivElement>, // Ref object to reference the AnvilFlexComponent
) => {
  // Selectors to determine whether the widget is selected or dragging
  const isSelected = useSelector(isWidgetSelected(widgetId));
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );
  // Get widget border styles using useWidgetBorderStyles
  const widgetBorderStyles = useWidgetBorderStyles(widgetId);

  // Effect hook to apply widget border styles to the widget
  useEffect(() => {
    Object.entries(widgetBorderStyles).forEach(([property, value]) => {
      if (ref.current) {
        // Set each border style property on the widget's DOM element
        ref.current.style[property as any] = value;
      }
    });
  }, [widgetBorderStyles]);

  // Effect hook to set a data attribute for testing purposes
  useEffect(() => {
    if (ref.current) {
      ref.current.setAttribute("data-widgetname-cy", widgetName);
      ref.current.setAttribute("data-testid", isSelected ? "t--selected" : "");
    }
  }, [widgetName, isSelected]);

  // Calculate whether the widget should fade based on dragging, selection, and visibility
  const shouldFadeWidget = (isDragging && isSelected) || !isVisible;

  // Calculate opacity factor based on whether the widget should fade
  const opacityFactor = useMemo(() => {
    return shouldFadeWidget ? 0.5 : 1;
  }, [shouldFadeWidget]);

  // Effect hook to set the opacity of the widget's DOM element
  useEffect(() => {
    if (ref.current) {
      ref.current.style.opacity = opacityFactor.toString();
    }
  }, [opacityFactor]);
};
