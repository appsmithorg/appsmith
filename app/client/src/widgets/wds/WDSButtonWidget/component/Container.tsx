import React from "react";

import type { RenderMode } from "constants/WidgetConstants";
import styled from "styled-components";

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
