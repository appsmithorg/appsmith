import React from "react";
import styled from "styled-components";

import { RenderModes } from "constants/WidgetConstants";
import type { RenderMode } from "constants/WidgetConstants";

const StyledContainer = styled.div`
  height: 100%;
  position: relative;

  .auto-height-container & [data-button] {
    min-height: 32px;
  }

  .auto-layout & > [data-button] {
    display: flex;
    width: auto;
    height: auto;
    max-width: 352px;
    min-width: 112px;
    min-height: 32px;
  }

  .grecaptcha-badge {
    visibility: hidden;
  }

  // Note: adding important here as ADS is overriding the color of blueprint icon globally
  // TODO(pawan): Ask Albin if we can remove the important in ADS Code
  & [data-button] .bp3-icon {
    color: currentColor !important;
  }
`;

type ContainerProps = {
  children?: React.ReactNode;
  renderMode?: RenderMode;
  showInAllModes?: boolean;
};

export function Container(props: ContainerProps) {
  if (props.renderMode === RenderModes.CANVAS || props.showInAllModes) {
    return <StyledContainer>{props.children}</StyledContainer>;
  }

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{props.children}</>;
}
