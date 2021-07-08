import { get } from "lodash";
import { useShowPropertyPane } from "utils/hooks/dragResizeHooks";
import { getIsPropertyPaneVisible } from "selectors/propertyPaneSelectors";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { useSelector } from "store";
import { AppState } from "reducers";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { APP_MODE } from "reducers/entityReducers/appReducer";
import { getAppMode } from "selectors/applicationSelectors";
import { getWidgets } from "sagas/selectors";
import { getSelectedWidget } from "selectors/ui";
import { useWidgetSelection } from "./useWidgetSelection";
import { useCallback, useRef } from "react";
import useClick from "utils/hooks/useClick";

/**
 *
 * @param widgetId
 * @param widgets
 * @returns
 */
export function getParentToOpenIfAny(
  widgetId: string | undefined,
  widgets: CanvasWidgetsReduxState,
) {
  if (widgetId) {
    let widget = get(widgets, widgetId, undefined);

    // While this widget has a openParentPropertyPane equql to true
    while (widget?.openParentPropertyPane) {
      // Get parent widget props
      const parent = get(widgets, `${widget.parentId}`, undefined);

      // If parent has openParentPropertyPane = false, return the currnet parent
      if (!parent?.openParentPropertyPane) {
        return parent;
      }

      if (parent?.parentId && parent.parentId !== MAIN_CONTAINER_WIDGET_ID) {
        widget = get(widgets, `${widget.parentId}`, undefined);

        continue;
      }
    }

    return widget;
  }

  return;
}

export const useDoubleClickOpenPropPane = (widgetId: string) => {
  const showPropertyPane = useShowPropertyPane();
  const { focusWidget, selectWidget } = useWidgetSelection();
  const isPropPaneVisible = useSelector(getIsPropertyPaneVisible);
  const widgets: CanvasWidgetsReduxState = useSelector(getWidgets);
  const selectedWidgetId = useSelector(getSelectedWidget);
  const focusedWidgetId = useSelector(
    (state: AppState) => state.ui.widgetDragResize.focusedWidget,
  );
  // This state tells us whether a `ResizableComponent` is resizing
  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );
  const appMode = useSelector(getAppMode);

  // This state tells us whether a `DraggableComponent` is dragging
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );

  const parentWidgetToOpen = getParentToOpenIfAny(focusedWidgetId, widgets);
  const selectWidgetFn = (isMultiSelect: boolean) => {
    const widgetToSelect = parentWidgetToOpen
      ? parentWidgetToOpen.widgetId
      : focusedWidgetId;
    if (focusedWidgetId !== widgetToSelect) {
      focusWidget(widgetToSelect);
    }
    if (selectedWidgetId !== widgetToSelect) {
      selectWidget(widgetToSelect, isMultiSelect);
    }
  };
  const openPropertyPaneOnDoubleClickFn = () => {
    const widgetId = parentWidgetToOpen
      ? parentWidgetToOpen.widgetId
      : focusedWidgetId;
    showPropertyPane(widgetId, undefined, true);
  };
  const initSelectWidgetOnClick = (e: any, isDoubleClick = false) => {
    // ignore click captures if the component was resizing or dragging coz it is handled internally in draggable component
    if (
      isResizing ||
      isDragging ||
      appMode !== APP_MODE.EDIT ||
      widgetId !== focusedWidgetId
    )
      return;
    if (
      (!isPropPaneVisible && selectedWidgetId === focusedWidgetId) ||
      selectedWidgetId !== focusedWidgetId
    ) {
      const isMultiSelect = e.metaKey || e.ctrlKey;
      selectWidgetFn(isMultiSelect);
      if (isDoubleClick) {
        openPropertyPaneOnDoubleClickFn();
      }
      if (isMultiSelect) {
        e.stopPropagation();
      }
    }
  };
  const initSelectWidgetOnDoubleClick = useCallback(
    (e) => initSelectWidgetOnClick(e, true),
    [widgetId, initSelectWidgetOnClick],
  );
  // Positioned Widget is the top enclosure for all widgets and clicks on/inside the widget should not be propogated/bubbled out of this Container.
  const doubleClickRef = useRef<HTMLDivElement | null>(null);
  useClick(
    doubleClickRef,
    initSelectWidgetOnClick,
    initSelectWidgetOnDoubleClick,
    true,
  );
  return doubleClickRef;
};
