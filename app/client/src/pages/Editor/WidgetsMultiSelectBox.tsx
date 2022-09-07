import React, { useMemo, useRef } from "react";
import styled from "styled-components";
import { get, minBy } from "lodash";
import { useSelector, useDispatch } from "react-redux";

import {
  copyWidget,
  cutWidget,
  groupWidgets,
  deleteSelectedWidget,
} from "actions/widgetActions";
import { modText } from "utils/helpers";
import { Layers } from "constants/Layers";
import { FormIcons } from "icons/FormIcons";
import { TooltipComponent as Tooltip } from "design-system";
import { ControlIcons } from "icons/ControlIcons";
import { getSelectedWidgets } from "selectors/ui";

import { stopEventPropagation } from "utils/AppsmithUtils";
import { getCanvasWidgets } from "selectors/entitiesSelector";
import { IPopoverSharedProps } from "@blueprintjs/core";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import WidgetFactory from "utils/WidgetFactory";
import { AppState } from "reducers";
import { useWidgetDragResize } from "utils/hooks/dragResizeHooks";
import { getBoundariesFromSelectedWidgets } from "sagas/WidgetOperationUtils";
import { CONTAINER_GRID_PADDING } from "constants/WidgetConstants";

const WidgetTypes = WidgetFactory.widgetTypes;
const StyledSelectionBox = styled.div`
  position: absolute;
  cursor: grab;
`;

const StyledActionsContainer = styled.div`
  position: relative;
  height: 100%;
  width: 100%;
`;

const StyledActions = styled.div`
  left: calc(100% - 38px);
  padding: 5px 0;
  width: max-content;
  z-index: ${Layers.contextMenu};
  position: absolute;
  background-color: ${(props) => props.theme.colors.appBackground};
`;

const StyledAction = styled.button`
  cursor: pointer;
  height: 28px;
  width: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 5px;
  outline: none;
  border: none;
  background: transparent;
  z-index: ${Layers.contextMenu};
  position: relative;

  &:hover,
  &:active,
  &.active {
    background: ${(props) =>
      props.disabled
        ? "initial"
        : props.theme.colors.widgetGroupingContextMenu.actionActiveBg};
  }
  &:focus {
    outline: none;
  }
`;

const StyledSelectBoxHandleTop = styled.div`
  width: 100%;
  height: 1px;
  position: absolute;
  z-index: ${Layers.contextMenu};
  border-top: 1px dashed
    ${(props) => props.theme.colors.widgetGroupingContextMenu.border};
  top: 0px;
  left: -1px;
`;

const StyledSelectBoxHandleLeft = styled.div`
  width: 0px;
  height: 100%;
  position: absolute;
  z-index: ${Layers.contextMenu};
  border-left: 1px dashed
    ${(props) => props.theme.colors.widgetGroupingContextMenu.border};
  top: 0px;
  left: -1px;
`;

const StyledSelectBoxHandleRight = styled.div`
  width: 0px;
  height: 100%;
  position: absolute;
  z-index: ${Layers.contextMenu};
  border-left: 1px dashed
    ${(props) => props.theme.colors.widgetGroupingContextMenu.border};
  top: 0px;
  left: calc(100% - 1px);
`;

const StyledSelectBoxHandleBottom = styled.div`
  width: 100%;
  height: 1px;
  position: absolute;
  z-index: ${Layers.contextMenu};
  border-bottom: 1px dashed
    ${(props) => props.theme.colors.widgetGroupingContextMenu.border};
  top: 100%;
  left: -1px;
`;

export const PopoverModifiers: IPopoverSharedProps["modifiers"] = {
  offset: {
    enabled: true,
  },
  arrow: {
    enabled: false,
  },
};

const CopyIcon = ControlIcons.COPY2_CONTROL;
const DeleteIcon = FormIcons.DELETE_ICON;
const CutIcon = ControlIcons.CUT_CONTROL;
const GroupIcon = ControlIcons.GROUP_CONTROL;

/**
 * helper text that comes in popover on hover of actions in context menu
 * @returns
 */
const copyHelpText = (
  <>
    Click or <b>{modText()} C</b> & {modText()} V
  </>
);
const cutHelpText = (
  <>
    Click or <b>{modText()} X</b> & {modText()} V
  </>
);
const deleteHelpText = (
  <>
    Click or <b> Del </b>
  </>
);
const groupHelpText = (
  <>
    Click or <b>{modText()} G to group</b>
  </>
);

function WidgetsMultiSelectBox(props: {
  widgetId: string;
  widgetType: string;
  noContainerOffset: boolean;
  snapColumnSpace: number;
  snapRowSpace: number;
}): any {
  const dispatch = useDispatch();
  const canvasWidgets = useSelector(getCanvasWidgets);
  const selectedWidgetIDs = useSelector(getSelectedWidgets);
  const selectedWidgets = selectedWidgetIDs.map(
    (widgetID) => canvasWidgets[widgetID],
  );
  const { focusWidget } = useWidgetSelection();
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );
  /**
   * the multi-selection bounding box should only render when:
   *
   * 1. the widgetID is equal to the parent id of selected widget
   * 2. has common parent
   * 3. multiple widgets are selected
   */
  const shouldRender = useMemo(() => {
    if (isDragging) {
      return false;
    }
    const parentIDs = selectedWidgets
      .filter(Boolean)
      .map((widget) => widget.parentId);
    const hasCommonParent = parentIDs.every((v) => v === parentIDs[0]);
    const isMultipleWidgetsSelected = selectedWidgetIDs.length > 1;

    return (
      props.widgetType === WidgetTypes.CANVAS_WIDGET &&
      isMultipleWidgetsSelected &&
      hasCommonParent &&
      get(selectedWidgets, "0.parentId") === props.widgetId
    );
  }, [selectedWidgets, isDragging]);
  const draggableRef = useRef<HTMLDivElement>(null);
  const { setDraggingState } = useWidgetDragResize();

  const onDragStart = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggableRef.current) {
      const bounds = draggableRef.current.getBoundingClientRect();
      const parentId = get(selectedWidgets, "0.parentId");
      const startPoints = {
        top: (e.clientY - bounds.top) / props.snapRowSpace,
        left: (e.clientX - bounds.left) / props.snapColumnSpace,
      };
      const top = minBy(selectedWidgets, (rect) => rect.topRow)?.topRow;
      const left = minBy(selectedWidgets, (rect) => rect.leftColumn)
        ?.leftColumn;
      setDraggingState({
        isDragging: true,
        dragGroupActualParent: parentId || "",
        draggingGroupCenter: {
          top,
          left,
        },
        startPoints,
      });
    }
  };

  /**
   * calculate bounding box
   */
  const { height, left, top, width } = useMemo(() => {
    if (shouldRender) {
      const {
        leftMostColumn,
        topMostRow,
        totalHeight,
        totalWidth,
      } = getBoundariesFromSelectedWidgets(selectedWidgets);

      return {
        top:
          topMostRow * props.snapRowSpace +
          (props.noContainerOffset ? 0 : CONTAINER_GRID_PADDING),
        left:
          leftMostColumn * props.snapColumnSpace +
          (props.noContainerOffset ? 0 : CONTAINER_GRID_PADDING),
        height: totalHeight * props.snapRowSpace,
        width: totalWidth * props.snapColumnSpace,
      };
    }

    return {};
  }, [
    selectedWidgets,
    props.snapColumnSpace,
    props.snapRowSpace,
    props.noContainerOffset,
  ]);

  /**
   * copies the selected widgets
   *
   * @param e
   */
  const onCopySelectedWidgets = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(copyWidget(true));

    return false;
  };

  /**
   * cut the selected widgets
   *
   * @param e
   */
  const onCutSelectedWidgets = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    dispatch(cutWidget());
  };

  /**
   * cut the selected widgets
   *
   * @param e
   */
  const onDeleteSelectedWidgets = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    dispatch(deleteSelectedWidget(true));
  };

  /**
   * group widgets into container
   *
   * @param e
   */
  const onGroupWidgets = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    dispatch(groupWidgets());
  };

  if (!shouldRender) return false;

  return (
    <StyledSelectionBox
      className="t--multi-selection-box"
      data-testid="t--selection-box"
      draggable
      key={`selection-box-${props.widgetId}`}
      onDragStart={onDragStart}
      onMouseMove={() => focusWidget()}
      onMouseOver={() => focusWidget()}
      ref={draggableRef}
      style={{
        left,
        top,
        height,
        width,
      }}
    >
      <StyledSelectBoxHandleTop />
      <StyledSelectBoxHandleLeft />
      <StyledSelectBoxHandleRight />
      <StyledSelectBoxHandleBottom />
      <StyledActionsContainer>
        <StyledActions>
          {/* copy widgets */}
          <Tooltip
            boundary="viewport"
            content={copyHelpText}
            maxWidth="400px"
            modifiers={PopoverModifiers}
            position="right"
          >
            <StyledAction
              onClick={stopEventPropagation}
              onClickCapture={onCopySelectedWidgets}
            >
              <CopyIcon color="black" height={16} width={16} />
            </StyledAction>
          </Tooltip>
          {/* cut widgets */}
          <Tooltip
            boundary="viewport"
            content={cutHelpText}
            maxWidth="400px"
            modifiers={PopoverModifiers}
            position="right"
          >
            <StyledAction
              onClick={stopEventPropagation}
              onClickCapture={onCutSelectedWidgets}
            >
              <CutIcon color="black" height={16} width={16} />
            </StyledAction>
          </Tooltip>
          {/* delete widgets */}
          <Tooltip
            boundary="viewport"
            content={deleteHelpText}
            maxWidth="400px"
            modifiers={PopoverModifiers}
            position="right"
          >
            <StyledAction
              onClick={stopEventPropagation}
              onClickCapture={onDeleteSelectedWidgets}
            >
              <DeleteIcon color="black" height={16} width={16} />
            </StyledAction>
          </Tooltip>
          {/* group widgets */}
          <Tooltip
            boundary="viewport"
            content={groupHelpText}
            maxWidth="400px"
            modifiers={PopoverModifiers}
            position="right"
          >
            <StyledAction
              onClick={stopEventPropagation}
              onClickCapture={onGroupWidgets}
            >
              <GroupIcon color="black" height={16} width={16} />
            </StyledAction>
          </Tooltip>
        </StyledActions>
      </StyledActionsContainer>
    </StyledSelectionBox>
  );
}

export default WidgetsMultiSelectBox;
