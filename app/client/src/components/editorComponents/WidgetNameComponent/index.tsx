import React from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import { PropertyPaneReduxState } from "reducers/uiReducers/propertyPaneReducer";
import SettingsControl, { Activities } from "./SettingsControl";
import {
  useShowPropertyPane,
  useWidgetSelection,
} from "utils/hooks/dragResizeHooks";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { WidgetType } from "constants/WidgetConstants";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";

const PositionStyle = styled.div`
  position: absolute;
  top: -${(props) => props.theme.spaces[10]}px;
  height: ${(props) => props.theme.spaces[10]}px;
  width: 100%;
  left: 0;
  display: flex;
  padding: 0 4px;
`;

const ControlGroup = styled.div`
  display: flex;
  margin-left: auto;
  justify-content: flex-start;
  align-items: center;
  height: 100%;
  & > span {
    height: 100%;
  }
`;

type WidgetNameComponentProps = {
  widgetName: string;
  widgetId: string;
  parentId?: string;
  type: WidgetType;
  showControls?: boolean;
};

export const WidgetNameComponent = (props: WidgetNameComponentProps) => {
  const showPropertyPane = useShowPropertyPane();
  // Dispatch hook handy to set a widget as focused/selected
  const { selectWidget } = useWidgetSelection();
  const propertyPaneState: PropertyPaneReduxState = useSelector(
    (state: AppState) => state.ui.propertyPane,
  );
  const selectedWidget = useSelector(
    (state: AppState) => state.ui.widgetDragResize.selectedWidget,
  );
  const focusedWidget = useSelector(
    (state: AppState) => state.ui.widgetDragResize.focusedWidget,
  );

  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );

  const togglePropertyEditor = (e: any) => {
    if (
      (!propertyPaneState.isVisible &&
        props.widgetId === propertyPaneState.widgetId) ||
      props.widgetId !== propertyPaneState.widgetId
    ) {
      PerformanceTracker.startTracking(
        PerformanceTransactionName.OPEN_PROPERTY_PANE,
      );
      AnalyticsUtil.logEvent("PROPERTY_PANE_OPEN_CLICK", {
        widgetType: props.type,
        widgetId: props.widgetId,
      });
      showPropertyPane && showPropertyPane(props.widgetId, undefined, true);
      selectWidget && selectWidget(props.widgetId);
    } else {
      AnalyticsUtil.logEvent("PROPERTY_PANE_CLOSE_CLICK", {
        widgetType: props.type,
        widgetId: props.widgetId,
      });
      showPropertyPane && showPropertyPane();
    }

    e.preventDefault();
    e.stopPropagation();
  };

  const showWidgetName =
    props.showControls ||
    ((focusedWidget === props.widgetId || selectedWidget === props.widgetId) &&
      !isDragging &&
      !isResizing);

  let currentActivity = Activities.NONE;
  if (focusedWidget === props.widgetId) currentActivity = Activities.HOVERING;
  if (selectedWidget === props.widgetId) currentActivity = Activities.SELECTED;
  if (
    propertyPaneState.isVisible &&
    propertyPaneState.widgetId === props.widgetId
  )
    currentActivity = Activities.ACTIVE;

  return showWidgetName ? (
    <PositionStyle>
      <ControlGroup>
        <SettingsControl
          toggleSettings={togglePropertyEditor}
          activity={currentActivity}
          name={props.widgetName}
        />
      </ControlGroup>
    </PositionStyle>
  ) : null;
};

export default WidgetNameComponent;
