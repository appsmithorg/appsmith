/* eslint-disable @typescript-eslint/no-unused-vars */
// import {
//   ENTITY_MORE_ACTIONS_TOOLTIP,
//   createMessage,
// } from "@appsmith/constants/messages";
// import { TOOLTIP_HOVER_ON_DELAY } from "constants/AppConstants";
// import { TooltipComponent } from "design-system-old";
import React from "react";
import { Button } from "design-system";
import styled from "styled-components";

const StyledButton = styled(Button)`
  && {
    height: 100%;
  }
`;

// const StyledTooltipComponent = styled(TooltipComponent)`
//   height: 100%;
// `;

//TODO: Remove this after porting to context menu

export function ContextMenuTrigger(props: { className?: string }) {
  // return <div>Test</div>;
  return (
    <Button
      className={props.className}
      isIconButton
      kind="tertiary"
      startIcon="more-vertical-control"
      type="button"
    />
  );
}

export default ContextMenuTrigger;
