import { AppState } from "@appsmith/reducers";
import { Popover2 } from "@blueprintjs/popover2";
import { bindDataToWidget } from "actions/propertyPaneActions";
import { Layers } from "constants/Layers";
import { WidgetType } from "constants/WidgetConstants";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { RESIZE_BORDER_BUFFER } from "resizable/resizenreflow";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { hideErrors } from "selectors/debuggerSelectors";
import {
  previewModeSelector,
  snipingModeSelector,
} from "selectors/editorSelectors";
import { getIsPropertyPaneVisible } from "selectors/propertyPaneSelectors";
import { getIsTableFilterPaneVisible } from "selectors/tableFilterSelectors";
import {
  isCurrentWidgetFocused,
  isWidgetSelected,
} from "selectors/widgetSelectors";
import styled from "styled-components";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  useShowTableFilterPane,
  useWidgetDragResize,
} from "utils/hooks/dragResizeHooks";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import WidgetFactory from "utils/WidgetFactory";
import { canDrag } from "../DraggableComponent";
import SettingsControl, { Activities } from "./SettingsControl";

const WidgetTypes = WidgetFactory.widgetTypes;

const PositionStyle = styled.div<{
  isSnipingMode: boolean;
}>`
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
  widgetProps: any;
  children: any;
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
  const shouldShowWidgetName = () => {
    return (
      !isResizingOrDragging &&
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
  const targetNode: any = document.getElementById(`${props.widgetId}`);

  // This state tells us to disable dragging,
  // This is usually true when widgets themselves implement drag/drop
  // This flag resolves conflicting drag/drop triggers.
  const isDraggingDisabled: boolean = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDraggingDisabled,
  );

  // True when any widget is dragging or resizing, including this one
  const isResizingOrDragging = !!isResizing || !!isDragging;
  const allowDrag = canDrag(
    isResizingOrDragging,
    isDraggingDisabled,
    props.widgetProps,
    isSnipingMode,
    isPreviewMode,
  );
  const isSelected = useSelector(isWidgetSelected(props.widgetId));
  // This state tels us which widget is focused
  // The value is the widgetId of the focused widget.
  const isFocused = useSelector(isCurrentWidgetFocused(props.widgetId));
  const { setDraggingState } = useWidgetDragResize();

  const onDragStart = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    // allowDrag check is added as react jest test simulation is not respecting default behaviour
    // of draggable=false and triggering onDragStart. allowDrag condition check is purely for the test cases.
    if (allowDrag && targetNode && !(e.metaKey || e.ctrlKey)) {
      if (!isFocused) return;

      if (!isSelected) {
        selectWidget(SelectionRequestType.One, [props.widgetId]);
      }
      const widgetHeight =
        props.widgetProps.bottomRow - props.widgetProps.topRow;
      const widgetWidth =
        props.widgetProps.rightColumn - props.widgetProps.leftColumn;
      const bounds = targetNode.getBoundingClientRect();
      const startPoints = {
        top: Math.min(
          Math.max(
            (e.clientY - bounds.top) / props.widgetProps.parentRowSpace,
            0,
          ),
          widgetHeight - 1,
        ),
        left: Math.min(
          Math.max(
            (e.clientX - bounds.left) / props.widgetProps.parentColumnSpace,
            0,
          ),
          widgetWidth - 1,
        ),
      };
      showTableFilterPane();
      setDraggingState({
        isDragging: true,
        dragGroupActualParent: props.widgetProps.parentId || "",
        draggingGroupCenter: { widgetId: props.widgetProps.widgetId },
        startPoints,
        draggedOn: props.widgetProps.parentId,
      });
    }
  };
  // bottom offset is RESIZE_BORDER_BUFFER - 1 because bottom border is none for the widget name
  const popperOffset: any = [-RESIZE_BORDER_BUFFER, RESIZE_BORDER_BUFFER - 1];
  const widgetWidth =
    (props.widgetProps.rightColumn - props.widgetProps.leftColumn) *
    props.widgetProps.parentColumnSpace;
  return (
    <Popover2
      autoFocus={false}
      content={
        // adding this here as well to instantly remove popper content. popper seems to be adding a transition state before hiding itself.
        // I could not find a way to turn it off.
        showWidgetName ? (
          <PositionStyle
            className={isSnipingMode ? "t--settings-sniping-control" : ""}
            data-testid="t--settings-controls-positioned-wrapper"
            draggable={allowDrag}
            id={"widget_name_" + props.widgetId}
            isSnipingMode={isSnipingMode}
            onDragStart={onDragStart}
          >
            <ControlGroup>
              <SettingsControl
                activity={currentActivity}
                errorCount={shouldHideErrors ? 0 : props.errorCount}
                name={props.widgetName}
                toggleSettings={togglePropertyEditor}
                widgetWidth={widgetWidth}
              />
            </ControlGroup>
          </PositionStyle>
        ) : (
          <div />
        )
      }
      enforceFocus={false}
      hoverCloseDelay={0}
      isOpen={showWidgetName}
      minimal
      modifiers={{
        offset: {
          enabled: true,
          options: {
            offset: popperOffset,
          },
        },
        flip: {
          enabled: false,
        },
        computeStyles: {
          options: {
            roundOffsets: false,
          },
        },
      }}
      placement="top-start"
      popoverClassName="widget-name-popper"
      portalContainer={document.getElementById("widgets-editor") || undefined}
      usePortal
    >
      {props.children}
    </Popover2>
  );
}

export default WidgetNameComponent;
