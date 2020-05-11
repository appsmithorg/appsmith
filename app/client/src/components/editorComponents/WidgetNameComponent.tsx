import React, { useContext } from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import { ControlIcons } from "icons/ControlIcons";
import { EditorContext } from "components/editorComponents/EditorContextProvider";
import { theme } from "constants/DefaultTheme";
import { Colors } from "constants/Colors";
import { PropertyPaneReduxState } from "reducers/uiReducers/propertyPaneReducer";
import { Tooltip } from "@blueprintjs/core";
import { useShowPropertyPane } from "utils/hooks/dragResizeHooks";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { WidgetOperations } from "widgets/BaseWidget";
import { WidgetType } from "constants/WidgetConstants";

const CONTROL_ICON_SIZE = 20;

const PositionStyle = styled.div<{ selected?: boolean }>`
  position: absolute;
  top: -${props => props.theme.spaces[7]}px;
  left: ${props => props.theme.spaces[5]}px;
  font-size: ${props => props.theme.fontSizes[2]}px;
  font-weight: ${props => props.theme.fontWeights[2]};
  text-align: left;
  width: 100%;
  z-index: 2;
  display: inline-block;
  & pre {
    display: inline;
    padding: 3px;
    background: ${props =>
      props.selected
        ? props.theme.colors.widgetBorder
        : props.theme.colors.widgetSecondaryBorder};
  }
`;

const DeleteControl = styled.div`
  position: absolute;
  right: ${props => props.theme.spaces[13]}px;
  top: -${props => props.theme.spaces[2]}px;
  cursor: pointer;
`;

const EditControl = styled.div`
  position: absolute;
  right: ${props => props.theme.spaces[4]}px;
  top: -${props => props.theme.spaces[2]}px;
  cursor: pointer;
`;

const DeleteIcon = ControlIcons.DELETE_CONTROL;
const deleteControlIcon = (
  <DeleteIcon width={CONTROL_ICON_SIZE} height={CONTROL_ICON_SIZE} />
);
const EditIcon = ControlIcons.EDIT_CONTROL;

type WidgetNameComponentProps = {
  widgetName?: string;
  widgetId: string;
  parentId?: string;
  type: WidgetType;
  showControls?: boolean;
};

export const WidgetNameComponent = (props: WidgetNameComponentProps) => {
  const { updateWidget } = useContext(EditorContext);
  const showPropertyPane = useShowPropertyPane();
  const propertyPaneState: PropertyPaneReduxState = useSelector(
    (state: AppState) => state.ui.propertyPane,
  );
  const selectedWidget = useSelector(
    (state: AppState) => state.ui.editor.selectedWidget,
  );
  const focusedWidget = useSelector(
    (state: AppState) => state.ui.editor.focusedWidget,
  );

  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );

  const editIconProps = {
    width: CONTROL_ICON_SIZE,
    height: CONTROL_ICON_SIZE,
    color:
      propertyPaneState.widgetId === props.widgetId &&
      propertyPaneState.isVisible
        ? theme.colors.textDefault
        : theme.colors.textOnDarkBG,
    background:
      propertyPaneState.widgetId === props.widgetId &&
      propertyPaneState.isVisible
        ? Colors.HIT_GRAY
        : Colors.SHARK,
  };
  const editControlIcon = <EditIcon {...editIconProps} />;

  const deleteWidget = () => {
    AnalyticsUtil.logEvent("WIDGET_DELETE", {
      widgetName: props.widgetName,
      widgetType: props.type,
    });
    showPropertyPane && showPropertyPane();
    updateWidget &&
      updateWidget(WidgetOperations.DELETE, props.widgetId, {
        parentId: props.parentId,
      });
  };

  const togglePropertyEditor = (e: any) => {
    if (
      (!propertyPaneState.isVisible &&
        props.widgetId === propertyPaneState.widgetId) ||
      props.widgetId !== propertyPaneState.widgetId
    ) {
      AnalyticsUtil.logEvent("PROPERTY_PANE_OPEN_CLICK", {
        widgetType: props.type,
        widgetId: props.widgetId,
      });
      showPropertyPane && showPropertyPane(props.widgetId, undefined, true);
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
  return showWidgetName ? (
    <PositionStyle selected={selectedWidget === props.widgetId}>
      <pre>{props.widgetName}</pre>
      <DeleteControl
        className="control t--widget-delete-control"
        onClick={deleteWidget}
      >
        <Tooltip content="Delete" hoverOpenDelay={500}>
          {deleteControlIcon}
        </Tooltip>
      </DeleteControl>
      <EditControl
        className="control t--widget-propertypane-toggle"
        onClick={togglePropertyEditor}
      >
        <Tooltip content="Edit widget properties" hoverOpenDelay={500}>
          {editControlIcon}
        </Tooltip>
      </EditControl>
    </PositionStyle>
  ) : null;
};

export default WidgetNameComponent;
