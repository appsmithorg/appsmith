import { getPositionsByLayoutId } from "layoutSystems/common/selectors";
import { getAnvilWidgetDOMId } from "layoutSystems/common/utils/LayoutElementPositionsObserver/utils";
import { useCallback, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { getIsDragging } from "selectors/widgetDragSelectors";
import { useWidgetDragResize } from "utils/hooks/dragResizeHooks";

export const DETACHED_WIDGET_MOUSE_MOVE_EVENT =
  "DETACHED_WIDGET_MOUSE_MOVE_EVENT";

export interface AnvilDetachedWidgetsDnDDetail {
  event: MouseEvent;
}

export const useAnvilDetachedWidgetsDnD = (
  widgetId: string,
  layoutId: string,
  isVisible: boolean,
) => {
  const isDragging = useSelector(getIsDragging);
  const layoutPositions = useSelector(getPositionsByLayoutId(layoutId));
  const widgetDomRef = useRef<HTMLDivElement | null>(null);
  const { setDraggingCanvas } = useWidgetDragResize();
  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isVisible || e.target !== widgetDomRef.current) {
        return;
      }

      // simulate move on the top most edge of the layout
      const detail: AnvilDetachedWidgetsDnDDetail = {
        event: e,
      };

      document.dispatchEvent(
        new CustomEvent(DETACHED_WIDGET_MOUSE_MOVE_EVENT, {
          detail,
        }),
      );
    },
    [isVisible],
  );
  const onMouseOut = useCallback(() => {
    if (isVisible) {
      setDraggingCanvas("");
    }
  }, [isVisible]);

  useEffect(() => {
    if (isDragging) {
      const widgetClassName = `.${getAnvilWidgetDOMId(widgetId)}`;
      const widgetDom = document.querySelector(widgetClassName);

      if (widgetDom) {
        widgetDomRef.current = widgetDom as HTMLDivElement;
      }
    } else {
      widgetDomRef.current = null;
    }
  }, [isDragging]);
  useEffect(() => {
    if (isDragging && isVisible && layoutPositions && widgetDomRef.current) {
      widgetDomRef.current.addEventListener("mousemove", onMouseMove);
      widgetDomRef.current.addEventListener("mouseenter", onMouseMove);
      widgetDomRef.current.addEventListener("mouseleave", onMouseOut);
    }

    return () => {
      if (widgetDomRef.current) {
        widgetDomRef.current.removeEventListener("mouseenter", onMouseMove);
        widgetDomRef.current.removeEventListener("mousemove", onMouseMove);
        widgetDomRef.current.removeEventListener("mouseleave", onMouseOut);
      }
    };
  }, [isDragging, isVisible, onMouseMove, layoutPositions]);
};
