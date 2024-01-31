import { getAnvilSpaceDistributionStatus } from "layoutSystems/anvil/integrations/selectors";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { combinedPreviewModeSelector } from "selectors/editorSelectors";
import { isCurrentWidgetFocused } from "selectors/widgetSelectors";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";

export const useAnvilFlexHover = (
  widgetId: string,
  ref: React.RefObject<HTMLDivElement>,
) => {
  const isFocused = useSelector(isCurrentWidgetFocused(widgetId));
  const isPreviewMode = useSelector(combinedPreviewModeSelector);
  const isDistributingSpace = useSelector(getAnvilSpaceDistributionStatus);
  const { focusWidget } = useWidgetSelection();
  const handleMouseOver = (e: any) => {
    focusWidget &&
      !isFocused &&
      !isDistributingSpace &&
      !isPreviewMode &&
      focusWidget(widgetId);
    e.stopPropagation();
  };

  const handleMouseLeave = () => {
    // on leaving a widget, we reset the focused widget
    focusWidget && focusWidget();
  };
  useEffect(() => {
    if (ref.current) {
      ref.current.addEventListener("mouseover", handleMouseOver);
      ref.current.addEventListener("mouseleave", handleMouseLeave);
    }
    return () => {
      if (ref.current) {
        ref.current.removeEventListener("mouseover", handleMouseOver);
        ref.current.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [handleMouseOver, handleMouseLeave]);
};
