import React from "react";
import { ControlIcons } from "icons/ControlIcons";
import { withTheme } from "styled-components";
import { Theme } from "constants/DefaultTheme";
import { EntityTogglesWrapper } from "./ExplorerStyledComponents";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import TooltipComponent from "components/ads/Tooltip";
import {
  createMessage,
  ENTITY_MORE_ACTIONS_TOOLTIP,
} from "@appsmith/constants/messages";
import { TOOLTIP_HOVER_ON_DELAY } from "constants/AppConstants";
import { Position } from "@blueprintjs/core";

const ToggleIcon = styled(ControlIcons.MORE_VERTICAL_CONTROL)`
  &&& {
    flex-grow: 0;
    width: ${(props) => props.theme.fontSizes[3]}px;
    height: ${(props) => props.theme.fontSizes[3]}px;
    g {
      path {
        fill: ${Colors.GRAY};
      }
    }
  }
`;
export function ContextMenuTrigger(props: {
  className?: string;
  theme: Theme;
}) {
  return (
    <EntityTogglesWrapper
      className={props.className + " entity-context-menu-icon"}
    >
      <TooltipComponent
        boundary="viewport"
        content={createMessage(ENTITY_MORE_ACTIONS_TOOLTIP)}
        hoverOpenDelay={TOOLTIP_HOVER_ON_DELAY}
        position={Position.RIGHT}
      >
        <ToggleIcon
          height={props.theme.fontSizes[3]}
          width={props.theme.fontSizes[3]}
        />
      </TooltipComponent>
    </EntityTogglesWrapper>
  );
}

export default withTheme(ContextMenuTrigger);
