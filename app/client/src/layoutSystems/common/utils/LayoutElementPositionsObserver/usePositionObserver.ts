import type { RefObject } from "react";
import { useEffect } from "react";
import { positionObserver } from ".";
import { APP_MODE } from "entities/App";
import { useSelector } from "react-redux";
import { previewModeSelector } from "selectors/editorSelectors";
import { getAppMode } from "@appsmith/selectors/entitiesSelector";
import { getAnvilLayoutDOMId, getAnvilWidgetDOMId } from "./utils";
export type ObservableElementType = "widget" | "layout";

/**
 * A hook to register a widget or a layout with the position observer
 * @param type Are we registering a widget or a layout
 * @param ids Ids that accurately identify the widget or layout (also if it is a drop target)
 * @param ref The React Ref for the DOM node. This is used to observe or unobserve.
 */

export function usePositionObserver(
  type: ObservableElementType,
  ids: {
    widgetId?: string;
    layoutIndex?: number;
    layoutId?: string;
    canvasId?: string;
    isDropTarget?: boolean;
  },
  ref: RefObject<HTMLDivElement>,
) {
  const isPreviewMode = useSelector(previewModeSelector);
  const appMode = useSelector(getAppMode);

  useEffect(() => {
    // We don't need the observer in preview mode or the published app
    // This is because the positions need to be observed only to enable
    // editor features
    if (isPreviewMode || appMode === APP_MODE.PUBLISHED) {
      return;
    }

    if (ref?.current) {
      // For each type of element, we need to register it with the position observer
      // We also make sure to throw an error if the required ids are not provided
      switch (type) {
        case "widget":
          if (ids.widgetId === undefined)
            throw Error("Failed to observe widget: widgetId is undefined");
          positionObserver.observeWidget(ids.widgetId, ref);
          break;
        case "layout":
          if (ids.layoutId === undefined)
            throw Error("Failed to observe layout: layoutId is undefined");
          if (ids.canvasId === undefined)
            throw Error("Failed to observe layout: canvasId is undefined");
          positionObserver.observeLayout(
            ids.layoutId,
            ids.canvasId,
            !!ids.isDropTarget,
            ref,
          );
          break;
      }
    }
    // Unoregister the observer when the component unmounts
    // Or the ref changes

    // When unobserving, we pass the DOM Ids directly to the position observer
    // This is because we're storing the maps with the keys as DOM ids
    // This makes for a quick lookup to unobserve
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
          if (ids.canvasId === undefined)
            throw Error("Failed to unobserve layout: canvasId is undefined");
          positionObserver.unObserveLayout(
            getAnvilLayoutDOMId(ids.canvasId, ids.layoutId),
          );
          break;
      }
    };
  }, [ref, type]);
}
