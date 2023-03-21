import type { AppState } from "@appsmith/reducers";
import { bindDataToWidget } from "actions/propertyPaneActions";
import type { WidgetType } from "constants/WidgetConstants";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { hideErrors } from "selectors/debuggerSelectors";
import {
  getCurrentAppPositioningType,
  previewModeSelector,
  snipingModeSelector,
} from "selectors/editorSelectors";
import { getIsPropertyPaneVisible } from "selectors/propertyPaneSelectors";
import { getIsTableFilterPaneVisible } from "selectors/tableFilterSelectors";
import styled from "styled-components";
import AnalyticsUtil from "utils/AnalyticsUtil";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import WidgetFactory from "utils/WidgetFactory";
import { useShowTableFilterPane } from "utils/hooks/dragResizeHooks";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import SettingsControl, { Activities } from "./SettingsControl";
import { theme } from "constants/DefaultTheme";
import { isCurrentWidgetFocused } from "selectors/widgetSelectors";
import { AppPositioningTypes } from "reducers/entityReducers/pageListReducer";
import { RESIZE_BORDER_BUFFER } from "resizable/common";
import { Layers } from "constants/Layers";

const WidgetTypes = WidgetFactory.widgetTypes;
export const WidgetNameComponentHeight = theme.spaces[10];

const PositionStyle = styled.div<{
  positionOffset: [number, number];
  topRow: number;
  isSnipingMode: boolean;
}>`
  position: absolute;
  top: ${(props) =>
    props.topRow > 2
      ? `${-1 * WidgetNameComponentHeight + 1 + props.positionOffset[0]}px`
      : `calc(100% - ${1 + props.positionOffset[0]}px)`};
  height: ${WidgetNameComponentHeight}px;
  ${(props) => `margin-left: ${props.positionOffset[1]}px`};
  display: flex;
  cursor: pointer;
  z-index: ${Layers.widgetName};
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
  widgetWidth: number;
};

export function WidgetNameComponent(props: WidgetNameComponentProps) {
  const dispatch = useDispatch();
  const isSnipingMode = useSelector(snipingModeSelector);
  const isPreviewMode = useSelector(previewModeSelector);
  const showTableFilterPane = useShowTableFilterPane();
  const isAutoCanvasResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isAutoCanvasResizing,
  );
  const appPositioningType = useSelector(getCurrentAppPositioningType);
  const isAutoLayout = appPositioningType === AppPositioningTypes.AUTO;
  // Dispatch hook handy to set a widget as focused/selected
  const { selectWidget } = useWidgetSelection();
  const isPropPaneVisible = useSelector(getIsPropertyPaneVisible);
  const selectedWidget = useSelector(
    (state: AppState) => state.ui.widgetDragResize.lastSelectedWidget,
  );
  const selectedWidgets = useSelector(
    (state: AppState) => state.ui.widgetDragResize.selectedWidgets,
  );
  const isFocused = useSelector(isCurrentWidgetFocused(props.widgetId));
  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );

  const shouldHideErrors = useSelector(hideErrors);

  const isTableFilterPaneVisible = useSelector(getIsTableFilterPaneVisible);

  const propertyPaneWidgetId =
    selectedWidgets.length === 1 ? selectedWidgets[0] : undefined;

  const togglePropertyEditor = (e: any) => {
    if (isSnipingMode) {
      dispatch(
        bindDataToWidget({
          widgetId: props.widgetId,
        }),
      );
    } else if (
      (!isPropPaneVisible && props.widgetId === propertyPaneWidgetId) ||
      props.widgetId !== propertyPaneWidgetId
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
      selectWidget && selectWidget(SelectionRequestType.One, [props.widgetId]);
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
  // True when any widget is dragging or resizing, including this one
  const isResizingOrDragging = !!isResizing || !!isDragging;
  const shouldShowWidgetName = () => {
    return (
      !isAutoCanvasResizing &&
      !isResizingOrDragging &&
      !isPreviewMode &&
      !isMultiSelectedWidget &&
      (isSnipingMode
        ? isFocused
        : props.showControls ||
          ((isFocused || showAsSelected) && !isDragging && !isResizing))
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
  if (isFocused) currentActivity = Activities.HOVERING;
  if (showAsSelected) currentActivity = Activities.SELECTED;
  if (
    showAsSelected &&
    isPropPaneVisible &&
    propertyPaneWidgetId === props.widgetId
  )
    currentActivity = Activities.ACTIVE;

  // bottom offset is RESIZE_BORDER_BUFFER - 1 because bottom border is none for the widget name
  const positionOffset: [number, number] = isAutoLayout
    ? [-RESIZE_BORDER_BUFFER / 2, -RESIZE_BORDER_BUFFER / 2]
    : [0, -RESIZE_BORDER_BUFFER];
  return showWidgetName ? (
    <PositionStyle
      className={isSnipingMode ? "t--settings-sniping-control" : ""}
      data-testid="t--settings-controls-positioned-wrapper"
      id={"widget_name_" + props.widgetId}
      isSnipingMode={isSnipingMode}
      positionOffset={positionOffset}
      topRow={props.topRow}
    >
      <ControlGroup>
        <SettingsControl
          activity={currentActivity}
          errorCount={shouldHideErrors ? 0 : props.errorCount}
          inverted={props.topRow <= 2}
          name={props.widgetName}
          toggleSettings={togglePropertyEditor}
          widgetWidth={props.widgetWidth}
        />
      </ControlGroup>
    </PositionStyle>
  ) : null;
}

export default WidgetNameComponent;
