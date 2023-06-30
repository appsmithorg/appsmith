import { WIDGET_PADDING } from "constants/WidgetConstants";
import type { RefObject } from "react";
import React from "react";
import styled from "styled-components";

import { scrollCSS } from "widgets/WidgetUtils";

type ListComponentProps = React.PropsWithChildren<{
  backgroundColor: string;
  borderRadius: string;
  boxShadow?: string;
  componentRef: RefObject<HTMLDivElement>;
  height: number;
  infiniteScroll?: boolean;
}>;

type StyledListContainerProps = Omit<
  ListComponentProps,
  "componentRef" | "height"
>;

const StyledListContainer = styled.div<StyledListContainerProps>`
  height: 100%;
  width: 100%;
  position: relative;
  background: ${(props) => props.backgroundColor};
  border-radius: ${({ borderRadius }) => borderRadius};
  box-shadow: ${({ boxShadow }) => boxShadow};
  overflow: hidden;
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

// This is to be improved for infiniteScroll.
const ScrollableCanvasWrapper = styled.div<
  Pick<ListComponentProps, "infiniteScroll" | "height">
>`
  ${({ infiniteScroll }) => (infiniteScroll ? scrollCSS : ``)}
  height: ${(props) => props.height - WIDGET_PADDING * 2}px;
`;

function ListComponent(props: ListComponentProps) {
  const {
    backgroundColor,
    borderRadius,
    boxShadow,
    componentRef,
    height,
    infiniteScroll,
  } = props;

  return (
    <StyledListContainer
      backgroundColor={backgroundColor}
      borderRadius={borderRadius}
      boxShadow={boxShadow}
      ref={componentRef}
    >
      <ScrollableCanvasWrapper height={height} infiniteScroll={infiniteScroll}>
        {props.children}
      </ScrollableCanvasWrapper>
    </StyledListContainer>
  );
}

export default ListComponent;
