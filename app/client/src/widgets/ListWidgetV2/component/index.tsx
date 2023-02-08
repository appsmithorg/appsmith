import React, { RefObject } from "react";
import styled from "styled-components";

import { WIDGET_PADDING } from "constants/WidgetConstants";

type ListComponentProps = React.PropsWithChildren<{
  backgroundColor: string;
  borderRadius: string;
  boxShadow?: string;
  componentRef: RefObject<HTMLDivElement>;
  height: number;
}>;

type StyledListContainerProps = Omit<ListComponentProps, "componentRef">;

const StyledListContainer = styled.div<StyledListContainerProps>`
  height: ${(props) => props.height - WIDGET_PADDING * 2}px;
  width: 100%;
  position: relative;
  background: ${(props) => props.backgroundColor};
  border-radius: ${({ borderRadius }) => borderRadius};
  box-shadow: ${({ boxShadow }) => boxShadow};
`;

export const ListComponentEmpty = styled.div<{
  backgroundColor?: string;
}>`
  height: 100%;
  width: 100%;
  position: relative;
  background: ${(props) => props.backgroundColor ?? "white"};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: Verdana, sans;
  font-size: 10px;
  text-anchor: middle;
  color: rgb(102, 102, 102);
  box-shadow: ${(props) => `0px 0px 0px 1px ${props.theme.borders[2].color}`};
`;

function ListComponent(props: ListComponentProps) {
  const {
    backgroundColor,
    borderRadius,
    boxShadow,
    componentRef,
    height,
  } = props;

  return (
    <StyledListContainer
      backgroundColor={backgroundColor}
      borderRadius={borderRadius}
      boxShadow={boxShadow}
      height={height}
      ref={componentRef}
    >
      {props.children}
    </StyledListContainer>
  );
}

export default ListComponent;
