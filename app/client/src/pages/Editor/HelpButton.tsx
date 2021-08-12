import React, { useEffect } from "react";
import styled, { createGlobalStyle, withTheme } from "styled-components";
import { Popover, Position } from "@blueprintjs/core";

import DocumentationSearch, {
  bootIntercom,
} from "components/designSystems/appsmith/help/DocumentationSearch";
import Icon, { IconSize } from "components/ads/Icon";

import { HELP_MODAL_WIDTH } from "constants/HelpConstants";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { Theme } from "constants/DefaultTheme";
import { getAppsmithConfigs } from "../../configs";
import { getCurrentUser } from "../../selectors/usersSelectors";
import { useSelector } from "react-redux";

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
`;

const Trigger = withTheme(({ theme }: { theme: Theme }) => (
  <StyledTrigger>
    <Icon
      fillColor={theme.colors.globalSearch.helpIcon}
      name="help"
      size={IconSize.XS}
    />
  </StyledTrigger>
));

const onOpened = () => {
  AnalyticsUtil.logEvent("OPEN_HELP", { page: "Editor" });
};

const { intercomAppID } = getAppsmithConfigs();
function HelpButton() {
  const user = useSelector(getCurrentUser);

  useEffect(() => {
    bootIntercom(intercomAppID, user);
  }, [user?.email]);

  return (
    <Popover
      minimal
      modifiers={{
        offset: {
          enabled: true,
          offset: "0, 6",
        },
      }}
      onOpened={onOpened}
      popoverClassName="navbar-help-popover"
      position={Position.BOTTOM_RIGHT}
    >
      <>
        <HelpPopoverStyle />
        <Trigger />
      </>
      <div style={{ width: HELP_MODAL_WIDTH }}>
        <DocumentationSearch hideMinimizeBtn hideSearch hitsPerPage={4} />
      </div>
    </Popover>
  );
}

export default HelpButton;
