import React from "react";
import { EntityTogglesWrapper } from "./ExplorerStyledComponents";
import { TooltipComponent } from "design-system-old";
import {
  createMessage,
  ENTITY_MORE_ACTIONS_TOOLTIP,
} from "@appsmith/constants/messages";
import { TOOLTIP_HOVER_ON_DELAY } from "constants/AppConstants";
import { Icon } from "design-system";

export function ContextMenuTrigger(props: { className?: string }) {
  return (
    <EntityTogglesWrapper
      className={props.className + " entity-context-menu-icon"}
    >
      <TooltipComponent
        boundary="viewport"
        content={createMessage(ENTITY_MORE_ACTIONS_TOOLTIP)}
        hoverOpenDelay={TOOLTIP_HOVER_ON_DELAY}
        position="right"
      >
        <Icon name="more-vertical-control" size="md" />
      </TooltipComponent>
    </EntityTogglesWrapper>
  );
}

export default ContextMenuTrigger;
