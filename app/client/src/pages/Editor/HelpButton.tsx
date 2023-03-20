import React, { useEffect } from "react";
import styled, { createGlobalStyle, useTheme } from "styled-components";
import { Popover, Position } from "@blueprintjs/core";

import DocumentationSearch from "components/designSystems/appsmith/help/DocumentationSearch";
import { Icon, IconSize, TooltipComponent } from "design-system-old";

import { HELP_MODAL_WIDTH } from "constants/HelpConstants";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getCurrentUser } from "selectors/usersSelectors";
import { useSelector } from "react-redux";
import bootIntercom from "utils/bootIntercom";
import {
  createMessage,
  HELP_RESOURCE_TOOLTIP,
} from "@appsmith/constants/messages";
import { TOOLTIP_HOVER_ON_DELAY } from "constants/AppConstants";
import { useCallback } from "react";
import { useState } from "react";
import { BottomBarCTAStyles } from "./BottomBar/styles";
import type { Theme } from "constants/DefaultTheme";

const HelpPopoverStyle = createGlobalStyle`
  .bp3-popover.bp3-minimal.navbar-help-popover {
    margin-top: 0 !important;
  }
`;

const StyledTrigger = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  ${BottomBarCTAStyles}
`;

type TriggerProps = {
  tooltipsDisabled: boolean;
};

const Trigger = ({ tooltipsDisabled }: TriggerProps) => {
  const theme = useTheme() as Theme;

  return (
    <TooltipComponent
      content={createMessage(HELP_RESOURCE_TOOLTIP)}
      disabled={tooltipsDisabled}
      hoverOpenDelay={TOOLTIP_HOVER_ON_DELAY}
      modifiers={{
        preventOverflow: { enabled: true },
      }}
      position={"bottom"}
    >
      <StyledTrigger>
        <Icon
          fillColor={theme.colors.globalSearch.helpIcon}
          name="question-line"
          size={IconSize.XXXL}
        />
      </StyledTrigger>
    </TooltipComponent>
  );
};

function HelpButton() {
  const user = useSelector(getCurrentUser);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    bootIntercom(user);
  }, [user?.email]);

  const onOpened = useCallback(() => {
    AnalyticsUtil.logEvent("OPEN_HELP", { page: "Editor" });
    setIsHelpOpen(true);
  }, []);

  const onClose = useCallback(() => {
    setIsHelpOpen(false);
  }, []);

  return (
    <Popover
      minimal
      modifiers={{
        offset: {
          enabled: true,
          offset: "0, 6",
        },
      }}
      onClosed={onClose}
      onOpened={onOpened}
      popoverClassName="navbar-help-popover"
      position={Position.BOTTOM_RIGHT}
    >
      <>
        <HelpPopoverStyle />
        <Trigger tooltipsDisabled={isHelpOpen} />
      </>
      <div style={{ width: HELP_MODAL_WIDTH }}>
        <DocumentationSearch hideMinimizeBtn hideSearch hitsPerPage={4} />
      </div>
    </Popover>
  );
}

export default HelpButton;
