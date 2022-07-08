import React, { ReactNode } from "react";
import styled from "styled-components";

import { ComponentProps } from "widgets/BaseComponent";

const LayoutContainer = styled("div")<AutoLayoutContainerComponentProps>`
  display: flex;
  flex-direction: ${({ isVertical }) => (isVertical ? "column" : "row")};
  justify-content: flex-start;
  flex-wrap: wrap;
`;

function AutoLayoutContainerComponent(
  props: AutoLayoutContainerComponentProps,
) {
  return <LayoutContainer {...props}>{props.children}</LayoutContainer>;
}

export interface AutoLayoutContainerComponentProps extends ComponentProps {
  children?: ReactNode[];
  isVertical: boolean;
}

export default AutoLayoutContainerComponent;
