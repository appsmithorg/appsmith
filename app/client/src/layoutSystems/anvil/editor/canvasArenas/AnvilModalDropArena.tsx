import React from "react";
import { useSelector } from "react-redux";
import { getDragDetails, getWidgetByID } from "sagas/selectors";
import styled from "styled-components";
import type { DragDetails } from "reducers/uiReducers/dragResizeReducer";
import { DropWidgetsHereMessage } from "layoutSystems/anvil/common/messages";

export const EMPTY_MODAL_PADDING = 4;

const StyledModalEditorDropArenaWrapper = styled.div<{ isModalEmpty: boolean }>`
  position: relative;
  ${(props) =>
    props.isModalEmpty &&
    `
  padding: ${EMPTY_MODAL_PADDING}px;
  `}
`;
const StyledEmptyModalDropArena = styled.div<{
  isActive: boolean;
  isModalEmpty: boolean;
}>`
  visibility: ${(props) => (props.isModalEmpty ? "visible" : "hidden")};
  background-color: ${(props) =>
    props.isActive
      ? "var(--empty-modal-drop-arena-active-bg)"
      : "var(--empty-modal-drop-arena-bg)"};
  border-radius: 6px;
  border: 2px solid #fff;
  outline: 1px dotted
    ${(props) =>
      props.isActive
        ? "var(--empty-modal-drop-arena-outline-active-color)"
        : "var(--empty-modal-drop-arena-outline-color)"};
  outline-offset: -1px;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--empty-modal-drop-arena-text-color);
  position: absolute;
  inset: 0;
  font-size: var(--info-text-font-size);
  font-weight: var(--info-text-font-weight);
  line-height: var(--info-text-line-height);
`;

export const AnvilModalDropArena = ({
  children,
  layoutId,
  modalId,
}: {
  modalId: string;
  children: React.ReactNode;
  layoutId: string;
}) => {
  const dragDetails: DragDetails = useSelector(getDragDetails);

  /**
   * boolean to indicate if the widget is being dragged on this particular canvas.
   */
  const isCurrentDraggedCanvas =
    dragDetails && dragDetails.draggedOn === layoutId;
  const widget = useSelector(getWidgetByID(modalId));
  const isModalEmpty = widget.children?.length === 0;

  return (
    <StyledModalEditorDropArenaWrapper
      isModalEmpty={isModalEmpty}
      style={{ height: isModalEmpty ? "100%" : "auto" }}
    >
      <StyledEmptyModalDropArena
        isActive={isCurrentDraggedCanvas}
        isModalEmpty={isModalEmpty}
      >
        {DropWidgetsHereMessage()}
      </StyledEmptyModalDropArena>
      {children}
    </StyledModalEditorDropArenaWrapper>
  );
};
