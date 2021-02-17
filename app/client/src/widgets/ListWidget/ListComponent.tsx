import { Color } from "constants/Colors";
import styled, { css } from "styled-components";
import React, { RefObject, ReactNode } from "react";

import { ListWidgetProps } from "./ListWidget";
import { WidgetProps } from "widgets/BaseWidget";
import { generateClassName, getCanvasClassName } from "utils/generators";
import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";

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
`;

const ScrollableCanvasWrapper = styled.div<
  ListWidgetProps<WidgetProps> & {
    ref: RefObject<HTMLDivElement>;
  }
>`
  width: 100%;
  height: 100%;
  overflow: hidden;
  ${(props) => (props.shouldScrollContents ? scrollContents : "")}
`;

const ListComponent = (props: GridComponentProps) => {
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

export default ListComponent;
