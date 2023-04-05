import {
  ENTITY_MORE_ACTIONS_TOOLTIP,
  createMessage,
} from "@appsmith/constants/messages";
import { TOOLTIP_HOVER_ON_DELAY } from "constants/AppConstants";
import { TooltipComponent } from "design-system-old";
import React from "react";
import { Button } from "design-system";
import styled from "styled-components";

const StyledButton = styled(Button)`
  && {
    height: 100%;
  }
`;

const StyledTooltipComponent = styled(TooltipComponent)`
  height: 100%;
`;

export function ContextMenuTrigger(props: { className?: string }) {
  return (
    <StyledTooltipComponent
      boundary="viewport"
      content={createMessage(ENTITY_MORE_ACTIONS_TOOLTIP)}
      hoverOpenDelay={TOOLTIP_HOVER_ON_DELAY}
      position="right"
    >
      <StyledButton
        className={props.className}
        isIconButton
        kind="tertiary"
        startIcon="more-vertical-control"
      />
    </StyledTooltipComponent>
  );
}

export default ContextMenuTrigger;
