import React from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "reducers";
import { PropertyPaneReduxState } from "reducers/uiReducers/propertyPaneReducer";
import SettingsControl, { Activities } from "./SettingsControl";
import { useShowTableFilterPane } from "utils/hooks/dragResizeHooks";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { WidgetType } from "constants/WidgetConstants";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { getIsTableFilterPaneVisible } from "selectors/tableFilterSelectors";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import WidgetFactory from "utils/WidgetFactory";

const WidgetTypes = WidgetFactory.widgetTypes;
import {
  previewModeSelector,
  snipingModeSelector,
} from "selectors/editorSelectors";
import { bindDataToWidget } from "../../../actions/propertyPaneActions";
import { hideErrors } from "selectors/debuggerSelectors";
import { commentModeSelector } from "../../../selectors/commentsSelectors";

const PositionStyle = styled.div<{ topRow: number; isSnipingMode: boolean }>`
  position: absolute;
  top: ${(props) =>
    props.topRow > 2 ? `${-1 * props.theme.spaces[10]}px` : "calc(100%)"};
  height: ${(props) => props.theme.spaces[10]}px;
  ${(props) => (props.isSnipingMode ? "left: -7px" : "right: 0")};
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
  const dispatch = useDispatch();
  const isCommentMode = useSelector(commentModeSelector);
  const isSnipingMode = useSelector(snipingModeSelector);
  const isPreviewMode = useSelector(previewModeSelector);
  const showTableFilterPane = useShowTableFilterPane();
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

  const shouldHideErrors = useSelector(hideErrors);

  const isTableFilterPaneVisible = useSelector(getIsTableFilterPaneVisible);

  const togglePropertyEditor = (e: any) => {
    if (isSnipingMode) {
      dispatch(
        bindDataToWidget({
          widgetId: props.widgetId,
        }),
      );
    } else if (
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
      // hide table filter pane if open
      isTableFilterPaneVisible && showTableFilterPane && showTableFilterPane();
      selectWidget && selectWidget(props.widgetId);
    } else {
      AnalyticsUtil.logEvent("PROPERTY_PANE_CLOSE_CLICK", {
        widgetType: props.type,
        widgetId: props.widgetId,
      });
    }

    e.preventDefault();
    e.stopPropagation();
  };
  const showAsSelected =
    selectedWidget === props.widgetId ||
    selectedWidgets.includes(props.widgetId);

  const isMultiSelectedWidget =
    selectedWidgets &&
    selectedWidgets.length > 1 &&
    selectedWidgets.includes(props.widgetId);
  const shouldShowWidgetName = () => {
    return (
      !isCommentMode &&
      !isPreviewMode &&
      !isMultiSelectedWidget &&
      (isSnipingMode
        ? focusedWidget === props.widgetId
        : props.showControls ||
          ((focusedWidget === props.widgetId || showAsSelected) &&
            !isDragging &&
            !isResizing) ||
          (!!props.errorCount && !shouldHideErrors))
    );
  };

  // in sniping mode we only show the widget name tag if it's focused.
  // in case of widget selection in sniping mode, if it's successful we bind the data else carry on
  // with sniping mode.
  const showWidgetName = shouldShowWidgetName();

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
      className={isSnipingMode ? "t--settings-sniping-control" : ""}
      data-testid="t--settings-controls-positioned-wrapper"
      isSnipingMode={isSnipingMode}
      topRow={props.topRow}
    >
      <ControlGroup>
        <SettingsControl
          activity={currentActivity}
          errorCount={shouldHideErrors ? 0 : props.errorCount}
          name={props.widgetName}
          toggleSettings={togglePropertyEditor}
        />
      </ControlGroup>
    </PositionStyle>
  ) : null;
}

export default WidgetNameComponent;
