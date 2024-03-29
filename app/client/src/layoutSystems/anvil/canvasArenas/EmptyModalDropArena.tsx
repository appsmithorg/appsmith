import React from "react";
import { useSelector } from "react-redux";
import { getWidgetByID } from "sagas/selectors";
import styled from "styled-components";
import { WDSModalWidget } from "widgets/wds/WDSModalWidget";
import type { AnvilDnDStates } from "./hooks/useAnvilDnDStates";
const StyledEmptyModalDropArena = styled.div<{ isActive: boolean }>`
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
  position: absolute;
  top: 0;
  left: 0;
  color: var(--empty-modal-drop-arena-text-color);
  font-size: 14px;
  font-weight: 510;
  line-height: 19.6px;
`;
export const EmptyModalDropArena = (props: {
  canvasId: string;
  anvilDragStates: AnvilDnDStates;
}) => {
  const widget = useSelector(getWidgetByID(props.canvasId));
  const isModal = widget?.type === WDSModalWidget.type;
  const isModalEmpty = isModal && widget.children?.length === 0;
  return isModalEmpty ? (
    <StyledEmptyModalDropArena
      isActive={props.anvilDragStates.isCurrentDraggedCanvas}
    >
      Drop Widgets Here
    </StyledEmptyModalDropArena>
  ) : null;
};
