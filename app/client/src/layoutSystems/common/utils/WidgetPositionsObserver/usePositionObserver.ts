import type { RefObject } from "react";
import { useEffect } from "react";
import { positionObserver } from ".";
import { getAnvilWidgetDOMId } from "./utils";
export type ObservableElementType = "widget" | "layout";

export function usePositionObserver(
  type: ObservableElementType,
  ids: {
    widgetId?: string;
    layoutIndex?: number;
    layoutId?: string;
    canvasId?: string;
  },
  ref: RefObject<HTMLDivElement>,
) {
  useEffect(() => {
    if (ref?.current) {
      // For each type of element, we need to register it with the position observer
      // We also make sure to throw an error if the required ids are not provided
      switch (type) {
        case "widget":
          if (ids.widgetId === undefined)
            throw Error("Failed to observe widget: widgetId is undefined");
          positionObserver.observeWidget(
            ids.widgetId,
            getAnvilWidgetDOMId(ids.widgetId),
            ref,
          );
          break;
        case "layout":
          if (ids.layoutId === undefined)
            throw Error("Failed to observe layout: layoutId is undefined");
          if (ids.canvasId === undefined)
            throw Error("Failed to observe layout: canvasId is undefined");
          if (ids.layoutIndex === undefined)
            throw Error("Failed to observe layout: layoutIndex is undefined");
          positionObserver.observeLayout(
            ids.layoutId,
            ids.canvasId,
            ids.layoutIndex,
            ref,
          );
          break;
      }
    }
    // Unoregister the observer when the component unmounts
    // Or the ref changes
    return () => {
      switch (type) {
        case "widget":
          if (ids.widgetId === undefined)
            throw Error("Failed to unobserve widget: widgetId is undefined");
          positionObserver.unObserveWidget(getAnvilWidgetDOMId(ids.widgetId));
          break;
        case "layout":
          if (ids.layoutId === undefined)
            throw Error("Failed to unobserve layout: layoutId is undefined");
          positionObserver.unObserveLayout(ids.layoutId);
          break;
      }
    };
  }, [ref, type]);
}
