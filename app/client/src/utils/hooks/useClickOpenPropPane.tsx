import {
  useShowPropertyPane,
  useWidgetSelection,
} from "utils/hooks/dragResizeHooks";
import {
  getCurrentWidgetId,
  getIsPropertyPaneVisible,
} from "selectors/propertyPaneSelectors";
import { useSelector } from "store";
import { AppState } from "reducers";
import { APP_MODE } from "reducers/entityReducers/appReducer";
import { getAppMode } from "selectors/applicationSelectors";

export const useClickOpenPropPane = () => {
  const showPropertyPane = useShowPropertyPane();
  const { selectWidget } = useWidgetSelection();
  const isPropPaneVisible = useSelector(getIsPropertyPaneVisible);
  const selectedWidgetId = useSelector(getCurrentWidgetId);
  const focusedWidget = useSelector(
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
  const openPropertyPane = (e: any, targetWidgetId: string) => {
    // ignore click captures if the component was resizing or dragging coz it is handled internally in draggable component
    if (
      isResizing ||
      isDragging ||
      appMode !== APP_MODE.EDIT ||
      targetWidgetId !== focusedWidget
    )
      return;
    if (
      (!isPropPaneVisible && selectedWidgetId === focusedWidget) ||
      selectedWidgetId !== focusedWidget
    ) {
      const isMultiSelect = e.metaKey || e.ctrlKey;
      selectWidget(focusedWidget, isMultiSelect);
      showPropertyPane(focusedWidget, undefined, true);
      if (isMultiSelect) {
        e.stopPropagation();
      }
    }
  };
  return openPropertyPane;
};
