import React, { useEffect } from "react";
import styled, { createGlobalStyle, withTheme } from "styled-components";
import { Popover, Position } from "@blueprintjs/core";

import DocumentationSearch from "components/designSystems/appsmith/help/DocumentationSearch";
import Icon, { IconSize } from "components/ads/Icon";

import { HELP_MODAL_WIDTH } from "constants/HelpConstants";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { Theme } from "constants/DefaultTheme";
import { getCurrentUser } from "selectors/usersSelectors";
import { useSelector } from "react-redux";
import bootIntercom from "utils/bootIntercom";
import { Colors } from "constants/Colors";
import { TooltipComponent } from "design-system";
import {
  createMessage,
  HELP_RESOURCE_TOOLTIP,
} from "@appsmith/constants/messages";
import { TOOLTIP_HOVER_ON_DELAY } from "constants/AppConstants";
import { useCallback } from "react";
import { useState } from "react";

const HelpPopoverStyle = createGlobalStyle`
  .bp3-popover.bp3-minimal.navbar-help-popover {
    margin-top: 0 !important;
  }
`;

const StyledTrigger = styled.div`
  cursor: pointer;
  width: 25px;
  height: 25px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 ${(props) => props.theme.spaces[4]}px;
  background: ${(props) =>
    props.theme.colors.globalSearch.helpButtonBackground};

  &:hover {
    border: 1.5px solid ${Colors.GREY_10};
  }
`;

type TriggerProps = {
  tooltipsDisabled: boolean;
  theme: Theme;
};

const Trigger = withTheme(({ theme, tooltipsDisabled }: TriggerProps) => (
  <TooltipComponent
    content={createMessage(HELP_RESOURCE_TOOLTIP)}
    disabled={tooltipsDisabled}
    hoverOpenDelay={TOOLTIP_HOVER_ON_DELAY}
    position="bottom"
  >
    <StyledTrigger>
      <Icon
        fillColor={theme.colors.globalSearch.helpIcon}
        name="help"
        size={IconSize.LARGE}
      />
    </StyledTrigger>
  </TooltipComponent>
));

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
