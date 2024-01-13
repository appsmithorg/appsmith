import React from "react";
import styled, { css } from "styled-components";

import type { RenderMode } from "constants/WidgetConstants";

const StyledContainer = styled.div<ContainerProps>`
  height: 100%;
  position: relative;

  ${({ maxWidth, minHeight, minWidth }) => css`
    & [data-button] {
      display: flex;
      width: auto;
      ${minWidth ? `min-width: ${minWidth}px;` : ""}
      ${minHeight ? `min-height: ${minHeight}px;` : ""}
        ${maxWidth ? `max-width: ${maxWidth}px;` : ""}
    }
  `}

  .grecaptcha-badge {
    visibility: hidden;
  }
`;

interface ContainerProps {
  children?: React.ReactNode;
  renderMode?: RenderMode;
  showInAllModes?: boolean;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
}

export function Container(props: ContainerProps) {
  const { children, ...rest } = props;

  return <StyledContainer {...rest}>{children}</StyledContainer>;
}
