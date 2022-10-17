import React, { RefObject } from "react";
import styled from "styled-components";

type ListComponentProps = React.PropsWithChildren<{
  backgroundColor: string;
  borderRadius: string;
  boxShadow?: string;
  componentRef: RefObject<HTMLDivElement>;
  height: number;
}>;

type StyledListContainerProps = Omit<ListComponentProps, "componentRef">;

const StyledListContainer = styled.div<StyledListContainerProps>`
  height: ${(props) => props.height}px;
  width: 100%;
  position: relative;
  background: ${(props) => props.backgroundColor};
  border-radius: ${({ borderRadius }) => borderRadius};
  box-shadow: ${({ boxShadow }) => boxShadow};
  overflow-y: auto;
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

export const ListComponentLoading = styled.div<{
  backgroundColor?: string;
}>`
  height: 100%;
  width: 100%;
  position: relative;
  overflow: hidden;
  box-shadow: 0px 0px 0px 1px #e7e7e7;

  & > div {
    background: ${(props) => props.backgroundColor ?? "white"};
    margin: 8px;
  }
`;

export default ListComponent;
