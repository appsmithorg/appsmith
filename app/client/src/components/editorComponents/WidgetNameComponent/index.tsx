import React from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import { PropertyPaneReduxState } from "reducers/uiReducers/propertyPaneReducer";
import SettingsControl, { Activities } from "./SettingsControl";
import { useShowPropertyPane } from "utils/hooks/dragResizeHooks";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { WidgetType } from "constants/WidgetConstants";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import WidgetFactory from "utils/WidgetFactory";

const WidgetTypes = WidgetFactory.widgetTypes;

const PositionStyle = styled.div<{ topRow: number }>`
  position: absolute;
  top: ${(props) =>
    props.topRow > 2 ? `${-1 * props.theme.spaces[10]}px` : "calc(100%)"};
  height: ${(props) => props.theme.spaces[10]}px;
  right: 0;
  display: flex;
  padding: 0 4px;
  cursor: pointer;
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
  topRow: number;
  errorCount: number;
};

export function WidgetNameComponent(props: WidgetNameComponentProps) {
  const showPropertyPane = useShowPropertyPane();
  // Dispatch hook handy to set a widget as focused/selected
  const { selectWidget } = useWidgetSelection();
  const propertyPaneState: PropertyPaneReduxState = useSelector(
    (state: AppState) => state.ui.propertyPane,
  );
  const selectedWidget = useSelector(
    (state: AppState) => state.ui.widgetDragResize.lastSelectedWidget,
  );
  const selectedWidgets = useSelector(
    (state: AppState) => state.ui.widgetDragResize.selectedWidgets,
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
        { widgetId: props.widgetId },
        true,
        [{ name: "widget_type", value: props.type }],
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
  const showAsSelected =
    selectedWidget === props.widgetId ||
    selectedWidgets.includes(props.widgetId);

  const showWidgetName =
    props.showControls ||
    ((focusedWidget === props.widgetId || showAsSelected) &&
      !isDragging &&
      !isResizing) ||
    !!props.errorCount;

  let currentActivity =
    props.type === WidgetTypes.MODAL_WIDGET
      ? Activities.HOVERING
      : Activities.NONE;
  if (focusedWidget === props.widgetId) currentActivity = Activities.HOVERING;
  if (showAsSelected) currentActivity = Activities.SELECTED;
  if (
    showAsSelected &&
    propertyPaneState.isVisible &&
    propertyPaneState.widgetId === props.widgetId
  )
    currentActivity = Activities.ACTIVE;

  return showWidgetName ? (
    <PositionStyle
      data-testid="t--settings-controls-positioned-wrapper"
      topRow={props.topRow}
    >
      <ControlGroup>
        <SettingsControl
          activity={currentActivity}
          errorCount={props.errorCount}
          name={props.widgetName}
          toggleSettings={togglePropertyEditor}
        />
      </ControlGroup>
    </PositionStyle>
  ) : null;
}

export default WidgetNameComponent;
