import React from "react";
import { useSelector } from "react-redux";
import { getWidgetByID } from "sagas/selectors";
import styled from "styled-components";
import { WDSModalWidget } from "widgets/wds/WDSModalWidget";
import type { AnvilDnDStates } from "./hooks/useAnvilDnDStates";
const StyledEmptyModalDropArena = styled.div<{ isActive: boolean }>`
  background-color: ${(props) => (props.isActive ? "#ffe5fe" : "#e6efff")};
  border-radius: 6px;
  border: 2px solid #fff;
  outline: 1px dotted ${(props) => (props.isActive ? "#ce01d3" : "#3075ff")};
  outline-offset: -1px;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 0;
  left: 0;
  color: #001040;
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
