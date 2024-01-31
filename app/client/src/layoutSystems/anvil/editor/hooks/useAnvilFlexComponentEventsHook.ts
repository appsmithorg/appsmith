import { getAnvilSpaceDistributionStatus } from "layoutSystems/anvil/integrations/selectors";
import { SELECT_ANVIL_WIDGET_CUSTOM_EVENT } from "layoutSystems/anvil/utils/constants";
import { generateDragStateForAnvilLayout } from "layoutSystems/anvil/utils/widgetUtils";
import { useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import {
  combinedPreviewModeSelector,
  snipingModeSelector,
} from "selectors/editorSelectors";
import { getShouldAllowDrag } from "selectors/widgetDragSelectors";
import {
  isCurrentWidgetFocused,
  isWidgetSelected,
} from "selectors/widgetSelectors";
import { useWidgetDragResize } from "utils/hooks/dragResizeHooks";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";

export const useAnvilFlexComponentEventsHook = (
  widgetId: string,
  layoutId: string,
  ref: React.RefObject<HTMLDivElement>,
) => {
  const isSelected = useSelector(isWidgetSelected(widgetId));
  const isFocused = useSelector(isCurrentWidgetFocused(widgetId));
  const isSnipingMode = useSelector(snipingModeSelector);
  const isPreviewMode = useSelector(combinedPreviewModeSelector);
  const isDistributingSpace = useSelector(getAnvilSpaceDistributionStatus);
  const stopEventPropagation = (e: MouseEvent) => {
    !isSnipingMode && e.stopPropagation();
  };
  const onClickFn = useCallback(
    function () {
      if (ref.current && isFocused) {
        ref.current.dispatchEvent(
          new CustomEvent(SELECT_ANVIL_WIDGET_CUSTOM_EVENT, {
            bubbles: true,
            cancelable: true,
            detail: { widgetId: widgetId },
          }),
        );
      }
    },
    [widgetId, isFocused],
  );
  const shouldAllowDrag = useSelector(getShouldAllowDrag);
  const { focusWidget, selectWidget } = useWidgetSelection();
  const generateDragState = useCallback(() => {
    return generateDragStateForAnvilLayout({
      layoutId,
    });
  }, [layoutId]);
  const { setDraggingState } = useWidgetDragResize();
  const onDragStart = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (shouldAllowDrag && ref.current && !(e.metaKey || e.ctrlKey)) {
        if (!isFocused) return;

        if (!isSelected) {
          selectWidget(SelectionRequestType.One, [widgetId]);
        }
        const draggingState = generateDragState();
        setDraggingState(draggingState);
      }
    },
    [
      shouldAllowDrag,
      isFocused,
      isSelected,
      selectWidget,
      widgetId,
      generateDragState,
      setDraggingState,
    ],
  );
  useEffect(() => {
    if (ref.current) {
      ref.current.addEventListener("click", onClickFn, { capture: true });
      ref.current.addEventListener("click", stopEventPropagation, {
        capture: false,
      });
    }
    return () => {
      if (ref.current) {
        ref.current.removeEventListener("click", onClickFn, { capture: true });
        ref.current.removeEventListener("click", stopEventPropagation, {
          capture: false,
        });
      }
    };
  }, [onClickFn, stopEventPropagation]);
  useEffect(() => {
    if (ref.current) {
      ref.current.draggable = shouldAllowDrag;
      ref.current.style.cursor = shouldAllowDrag ? "grab" : "default";
      ref.current.addEventListener("dragstart", onDragStart);
    }
    return () => {
      if (ref.current) {
        ref.current.removeEventListener("dragstart", onDragStart);
      }
    };
  }, [onDragStart, shouldAllowDrag]);
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
