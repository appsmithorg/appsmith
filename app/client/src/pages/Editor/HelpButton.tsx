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
import type { Theme } from "constants/DefaultTheme";
import { BottomBarCTAStyles } from "ce/components/BottomBar/styles";

const HelpPopoverStyle = createGlobalStyle`
  .bp3-popover.bp3-minimal.navbar-help-popover {
    margin-top: 0 !important;
  }
`;

const StyledTrigger = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  line-height: 14px;
  font-weight: 400;
  padding: 9px 16px;
  border-left: 1px solid #e7e7e7;
  cursor: pointer;
  ${BottomBarCTAStyles}
  -webkit-user-select: none; /* Safari */
  -ms-user-select: none; /* IE 10 and IE 11 */
  user-select: none; /* Standard syntax */
`;

function HelpButton() {
  const user = useSelector(getCurrentUser);
  const theme = useTheme() as Theme;
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
    <TooltipComponent
      content={createMessage(HELP_RESOURCE_TOOLTIP)}
      disabled={isHelpOpen}
      hoverOpenDelay={TOOLTIP_HOVER_ON_DELAY}
      modifiers={{
        preventOverflow: { enabled: true },
      }}
      position={"bottom"}
    >
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
          <StyledTrigger className="help-popover">
            <Icon
              fillColor={theme.colors.globalSearch.helpIcon}
              name="question-line"
              size={IconSize.XL}
            />
            <span>Help</span>
          </StyledTrigger>
        </>
        <div style={{ width: HELP_MODAL_WIDTH }}>
          <DocumentationSearch hideMinimizeBtn hideSearch hitsPerPage={4} />
        </div>
      </Popover>
    </TooltipComponent>
  );
}

export default HelpButton;
