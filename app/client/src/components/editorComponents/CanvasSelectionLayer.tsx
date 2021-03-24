import React from "react";
import { useShowPropertyPane } from "utils/hooks/dragResizeHooks";
import { selectWidget } from "actions/widgetActions";
import {
  getCurrentWidgetId,
  getIsPropertyPaneVisible,
} from "selectors/propertyPaneSelectors";
import { useSelector } from "store";
import { AppState } from "reducers";

export const CanvasSelectionLayer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const showPropertyPane = useShowPropertyPane();
  const isPropPaneVisible = useSelector(getIsPropertyPaneVisible);
  const selectedWidgetId = useSelector(getCurrentWidgetId);
  const focusedWidget = useSelector(
    (state: AppState) => state.ui.widgetDragResize.focusedWidget,
  );
  const openPropertyPane = () => {
    if (
      (!isPropPaneVisible && selectedWidgetId === focusedWidget) ||
      selectedWidgetId !== focusedWidget
    ) {
      selectWidget(focusedWidget);
      showPropertyPane(focusedWidget, undefined, true);
    }
  };
  return (
    <div onDoubleClickCapture={openPropertyPane} className="canvas-triggers">
      {children}
    </div>
  );
};
