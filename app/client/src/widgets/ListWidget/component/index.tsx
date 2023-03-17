import styled from "styled-components";
import React, { RefObject, ReactNode, useMemo } from "react";

import { ListWidgetProps } from "../constants";
import { WidgetProps } from "widgets/BaseWidget";
import { generateClassName, getCanvasClassName } from "utils/generators";

interface ListComponentProps {
  children?: ReactNode;
  shouldScrollContents?: boolean;
  backgroundColor: string;
  borderRadius: string;
  boxShadow?: string;

  listData: Array<Record<string, unknown>>;
  hasPagination?: boolean;
  widgetId: string;
}

const GridContainer = styled.div<ListComponentProps>`
  height: 100%;
  width: 100%;
  position: relative;
  overflow: hidden;
  background: ${(props) => props.backgroundColor};
  border-radius: ${({ borderRadius }) => borderRadius};
`;

const ScrollableCanvasWrapper = styled.div<
  ListWidgetProps<WidgetProps> & {
    ref: RefObject<HTMLDivElement>;
  }
>`
  width: 100%;
  height: 100%;
`;

function ListComponent(props: ListComponentProps) {
  // using memoized class name
  const scrollableCanvasClassName = useMemo(() => {
    return `${
      props.shouldScrollContents ? `${getCanvasClassName()}` : ""
    } ${generateClassName(props.widgetId)}`;
  }, [props.widgetId]);

  return (
    <GridContainer {...props}>
      <ScrollableCanvasWrapper className={scrollableCanvasClassName}>
        {props.children}
      </ScrollableCanvasWrapper>
    </GridContainer>
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
