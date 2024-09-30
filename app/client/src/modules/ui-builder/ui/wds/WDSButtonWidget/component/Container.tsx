import React from "react";
import styled from "styled-components";

import type { RenderMode } from "constants/WidgetConstants";

const StyledContainer = styled.div<ContainerProps>`
  height: 100%;
  position: relative;

  .grecaptcha-badge {
    visibility: hidden;
  }
`;

interface ContainerProps {
  children?: React.ReactNode;
  renderMode?: RenderMode;
  showInAllModes?: boolean;
}

export function Container(props: ContainerProps) {
  const { children, ...rest } = props;

  return <StyledContainer {...rest}>{children}</StyledContainer>;
}
