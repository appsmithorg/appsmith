import React, { RefObject, ReactNode } from "react";
import styled, { css } from "styled-components";
import { Color } from "constants/Colors";
import { ComponentProps } from "./BaseComponent";
import { GridWidgetProps } from "widgets/GridWidget";
import { generateClassName, getCanvasClassName } from "utils/generators";
import { WidgetProps } from "widgets/BaseWidget";

interface GridComponentProps extends ComponentProps {
  children?: ReactNode;
  shouldScrollContents?: boolean;
  backgroundColor?: Color;
  items: Array<Record<string, unknown>>;
}

const scrollContents = css`
  overflow-y: auto;
  position: absolute;
`;

const GridContainer = styled.div<GridComponentProps>`
  height: 100%;
  width: 100%;
  position: relative;
  background: ${(props) => props.backgroundColor};
  border: 1px solid #e1e1e1;
  border-bottom-right-radius: ${(props) => `${props.theme.radii[1]}px`};
  border-bottom-left-radius: ${(props) => `${props.theme.radii[1]}px`};
  border-top-right-radius: ${(props) => `${props.theme.radii[1]}px`};
  border-top-left-radius: ${(props) => `${props.theme.radii[1]}px`};
`;

const ScrollableCanvasWrapper = styled.div<
  GridWidgetProps<WidgetProps> & {
    ref: RefObject<HTMLDivElement>;
  }
>`
  width: 100%;
  height: 100%;
  overflow: hidden;
  ${(props) => (props.shouldScrollContents ? scrollContents : "")}
`;

const GridComponent = (props: GridComponentProps) => {
  const { ...remainingProps } = props;

  return (
    <GridContainer {...remainingProps}>
      <ScrollableCanvasWrapper
        className={`${
          props.shouldScrollContents ? getCanvasClassName() : ""
        } ${generateClassName(props.widgetId)}`}
      >
        {props.children}
      </ScrollableCanvasWrapper>
    </GridContainer>
  );
};

export default GridComponent;
