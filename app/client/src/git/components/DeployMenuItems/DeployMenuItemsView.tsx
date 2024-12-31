import React, { useCallback } from "react";
import { MenuItem } from "@appsmith/ads";
import { CONNECT_TO_GIT_OPTION, createMessage } from "ee/constants/messages";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import noop from "lodash/noop";

interface DeployMenuItemsViewProps {
  toggleConnectModal: (open: boolean) => void;
}

function DeployMenuItemsView({
  toggleConnectModal = noop,
}: DeployMenuItemsViewProps) {
  const handleClickOnConnect = useCallback(() => {
    AnalyticsUtil.logEvent("GS_CONNECT_GIT_CLICK", {
      source: "Deploy button",
    });
    toggleConnectModal(true);
  }, [toggleConnectModal]);

  return (
    <MenuItem
      data-testid="t--git-deploy-menu-connect"
      onClick={handleClickOnConnect}
      startIcon="git-branch"
    >
      {createMessage(CONNECT_TO_GIT_OPTION)}
    </MenuItem>
  );
}

export default DeployMenuItemsView;
