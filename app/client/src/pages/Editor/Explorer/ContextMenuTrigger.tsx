import React from "react";
import { ControlIcons } from "icons/ControlIcons";
import { EntityTogglesWrapper } from "./ExplorerStyledComponents";
import styled, { useTheme } from "styled-components";
import { Colors } from "constants/Colors";
import { TooltipComponent } from "design-system-old";
import {
  createMessage,
  ENTITY_MORE_ACTIONS_TOOLTIP,
} from "@appsmith/constants/messages";
import { TOOLTIP_HOVER_ON_DELAY } from "constants/AppConstants";
import type { Theme } from "constants/DefaultTheme";

const ToggleIcon = styled(ControlIcons.MORE_VERTICAL_CONTROL)`
  &&& {
    flex-grow: 0;
    g {
      path {
        fill: ${Colors.GRAY};
      }
    }
  }
`;
export function ContextMenuTrigger(props: { className?: string }) {
  const theme = useTheme() as Theme;

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
        <ToggleIcon height={theme.fontSizes[3]} width={theme.fontSizes[3]} />
      </TooltipComponent>
    </EntityTogglesWrapper>
  );
}

export default ContextMenuTrigger;
