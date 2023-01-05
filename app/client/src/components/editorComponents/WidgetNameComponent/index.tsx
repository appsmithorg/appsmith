import { AppState } from "@appsmith/reducers";
import { bindDataToWidget } from "actions/propertyPaneActions";
import { Layers } from "constants/Layers";
import { WidgetType } from "constants/WidgetConstants";
import Popper from "pages/Editor/Popper";
import { Data } from "popper.js";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { hideErrors } from "selectors/debuggerSelectors";
import {
  previewModeSelector,
  snipingModeSelector,
} from "selectors/editorSelectors";
import { getIsPropertyPaneVisible } from "selectors/propertyPaneSelectors";
import { getIsTableFilterPaneVisible } from "selectors/tableFilterSelectors";
import styled from "styled-components";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { useShowTableFilterPane } from "utils/hooks/dragResizeHooks";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import WidgetFactory from "utils/WidgetFactory";
import SettingsControl, { Activities } from "./SettingsControl";

const WidgetTypes = WidgetFactory.widgetTypes;

const PositionStyle = styled.div<{ topRow: number; isSnipingMode: boolean }>`
  height: ${(props) => props.theme.spaces[10]}px;
  ${(props) => (props.isSnipingMode ? "left: -7px" : "left: 0px")};
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
  isFlexChild: boolean;
};

export function WidgetNameComponent(props: WidgetNameComponentProps) {
  const dispatch = useDispatch();
  const isSnipingMode = useSelector(snipingModeSelector);
  const isPreviewMode = useSelector(previewModeSelector);
  const showTableFilterPane = useShowTableFilterPane();
  // Dispatch hook handy to set a widget as focused/selected
  const { selectWidget } = useWidgetSelection();
  const isPropPaneVisible = useSelector(getIsPropertyPaneVisible);
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
      !isPreviewMode &&
      !isMultiSelectedWidget &&
      (isSnipingMode
        ? focusedWidget === props.widgetId
        : props.showControls ||
          ((focusedWidget === props.widgetId || showAsSelected) &&
            !isDragging &&
            !isResizing))
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
    isPropPaneVisible &&
    propertyPaneWidgetId === props.widgetId
  )
    currentActivity = Activities.ACTIVE;
  const targetNode: any = document.getElementById(`resize-${props.widgetId}`);
  return showWidgetName ? (
    <Popper
      isOpen
      modifiers={{
        offset: {
          enabled: true,
          fn: (data: Data) => {
            data.offsets.popper = {
              ...data.offsets.popper,
              left: data.offsets.popper.left - 4,
              top: data.offsets.popper.top - 3,
            };
            return data;
          },
        },
      }}
      placement="top-start"
      targetNode={targetNode}
      zIndex={Layers.widgetName - 1}
    >
      <PositionStyle
        className={isSnipingMode ? "t--settings-sniping-control" : ""}
        data-testid="t--settings-controls-positioned-wrapper"
        isSnipingMode={isSnipingMode}
        topRow={3}
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
    </Popper>
  ) : null;
}

export default WidgetNameComponent;
