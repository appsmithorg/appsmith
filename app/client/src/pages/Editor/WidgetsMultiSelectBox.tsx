import styled from "styled-components";
import React, { useMemo } from "react";
import { get, minBy, maxBy } from "lodash";
import { useSelector, useDispatch } from "react-redux";

import {
  copyWidget,
  cutWidget,
  deleteSelectedWidget,
} from "actions/widgetActions";
import { isMac } from "utils/helpers";
import { FormIcons } from "icons/FormIcons";
import Tooltip from "components/ads/Tooltip";
import { ControlIcons } from "icons/ControlIcons";
import { getSelectedWidgets } from "selectors/ui";
import { generateClassName } from "utils/generators";
import { getCanvasWidgets } from "selectors/entitiesSelector";
import { IPopoverSharedProps, Position } from "@blueprintjs/core";

const StyledSelectionBox = styled.div`
  position: absolute;
`;

const StyledActionsContainer = styled.div`
  position: relative;
  height: 100%;
  width: 100%;
`;

const StyledActions = styled.div`
  margin-left: calc(100% + 4px);
  padding: 5px 0;
  width: max-content;
  z-index: 4;
  position: relative;
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
  &:hover,
  &:active,
  &.active {
    background: ${(props) => (props.disabled ? "initial" : "#e1e1e1")};
  }
  &:focus {
    outline: none;
  }
`;

const StyledSelectBoxHandleTop = styled.div`
  width: 100%;
  height: 1px;
  position: absolute;
  z-index: 5;
  border-top: 1.5px dashed #69b5ff;
  top: -1px;
  left: -1px;
`;

const StyledSelectBoxHandleLeft = styled.div`
  width: 1px;
  height: 100%;
  position: absolute;
  z-index: 5;
  border-left: 1.5px dashed #69b5ff;
  top: -1px;
  left: -1px;
`;

const StyledSelectBoxHandleRight = styled.div`
  width: 1px;
  height: 100%;
  position: absolute;
  z-index: 5;
  border-left: 1.5px dashed #69b5ff;
  top: -1px;
  left: 100%;
`;

const StyledSelectBoxHandleBottom = styled.div`
  width: 100%;
  height: 1px;
  position: absolute;
  z-index: 5;
  border-bottom: 1.5px dashed #69b5ff;
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

/**
 * helper text that comes in popover on hover of actions in context menu
 * @returns
 */
const modText = () => (isMac() ? <span>&#8984;</span> : "ctrl");
const copyHelpText = (
  <>
    Click or <b>{modText()} + C</b> & {modText()} + V
  </>
);
const cutHelpText = (
  <>
    Click or <b>{modText()} + X</b> & {modText()} + V
  </>
);
const deleteHelpText = (
  <>
    Click or <b> Del </b>
  </>
);

interface OffsetBox {
  top: number;
  left: number;
  width: number;
  height: number;
}

function WidgetsMultiSelectBox(props: { widgetId: string }): any {
  const dispatch = useDispatch();
  const canvasWidgets = useSelector(getCanvasWidgets);
  const selectedWidgetIDs = useSelector(getSelectedWidgets);
  const selectedWidgets = selectedWidgetIDs.map(
    (widgetID) => canvasWidgets[widgetID],
  );

  /**
   * the multi-selection bounding box should only render when:
   *
   * 1. the widgetID is equal to the parent id of selected widget
   * 2. has common parent
   * 3. multiple widgets are selected
   */
  const shouldRender = useMemo(() => {
    const parentIDs = selectedWidgets
      .filter(Boolean)
      .map((widget) => widget.parentId);
    const hasCommonParent = parentIDs.every((v) => v === parentIDs[0]);
    const isMultipleWidgetsSelected = selectedWidgetIDs.length > 1;

    return (
      isMultipleWidgetsSelected &&
      hasCommonParent &&
      props.widgetId === get(selectedWidgets, "0.parentId")
    );
  }, [selectedWidgets]);

  /**
   * calculate bounding box
   */
  const { height, left, top, width } = useMemo(() => {
    if (shouldRender) {
      const widgetClasses = selectedWidgetIDs
        .map((id) => `.${generateClassName(id)}`)
        .join(",");
      const elements = document.querySelectorAll<HTMLElement>(widgetClasses);
      const rects: OffsetBox[] = [];

      elements.forEach((el) => {
        rects.push({
          top: el.offsetTop,
          left: el.offsetLeft,
          width: el.offsetWidth,
          height: el.offsetHeight,
        });
      });

      return {
        top: minBy(rects, (rect) => rect.top),
        left: minBy(rects, (rect) => rect.left),
        height: maxBy(rects, (rect) => rect.top + rect.height),
        width: maxBy(rects, (rect) => rect.left + rect.width),
      };
    }

    return {};
  }, [selectedWidgets]);

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

  if (!shouldRender) return false;

  return (
    <StyledSelectionBox
      style={{
        left: left?.left,
        top: top?.top,
        height:
          get(height, "top", 0) + get(height, "height", 0) - get(top, "top", 0),
        width:
          get(width, "left", 0) + get(width, "width", 0) - get(left, "left", 0),
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
            position={Position.RIGHT}
          >
            <StyledAction onClick={onCopySelectedWidgets}>
              <CopyIcon color="black" height={16} width={16} />
            </StyledAction>
          </Tooltip>
          {/* cut widgets */}
          <Tooltip
            boundary="viewport"
            content={cutHelpText}
            maxWidth="400px"
            modifiers={PopoverModifiers}
            position={Position.RIGHT}
          >
            <StyledAction onClick={onCutSelectedWidgets}>
              <CutIcon color="black" height={16} width={16} />
            </StyledAction>
          </Tooltip>
          {/* delete widgets */}
          <Tooltip
            boundary="viewport"
            content={deleteHelpText}
            maxWidth="400px"
            modifiers={PopoverModifiers}
            position={Position.RIGHT}
          >
            <StyledAction onClick={onDeleteSelectedWidgets}>
              <DeleteIcon color="black" height={16} width={16} />
            </StyledAction>
          </Tooltip>
        </StyledActions>
      </StyledActionsContainer>
    </StyledSelectionBox>
  );
}

export default WidgetsMultiSelectBox;
