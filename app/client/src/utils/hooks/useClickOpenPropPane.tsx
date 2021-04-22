import { useShowPropertyPane } from "utils/hooks/dragResizeHooks";
import { selectWidget } from "actions/widgetActions";
import {
  getCurrentWidgetId,
  getIsPropertyPaneVisible,
} from "selectors/propertyPaneSelectors";
import { useSelector } from "store";
import { AppState } from "reducers";
import { APP_MODE } from "reducers/entityReducers/appReducer";
import { getAppMode } from "selectors/applicationSelectors";

export const useClickOpenPropPane = (widgetId: string) => {
  const showPropertyPane = useShowPropertyPane();
  const isPropPaneVisible = useSelector(getIsPropertyPaneVisible);
  const selectedWidgetId = useSelector(getCurrentWidgetId);
  // This state tells us whether a `ResizableComponent` is resizing
  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );
  const appMode = useSelector(getAppMode);

  // This state tells us whether a `DraggableComponent` is dragging
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );
  const openPropertyPane = () => {
    // ignore click captures if the component was resizing or dragging coz it is handled internally in draggable component
    if (isResizing || isDragging || appMode !== APP_MODE.EDIT) return;
    if (
      (!isPropPaneVisible && selectedWidgetId === widgetId) ||
      selectedWidgetId !== widgetId
    ) {
      selectWidget(widgetId);
      showPropertyPane(widgetId, undefined, true);
    }
  };
  return openPropertyPane;
};
