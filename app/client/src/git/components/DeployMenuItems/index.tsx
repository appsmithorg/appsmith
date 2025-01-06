import useConnect from "git/hooks/useConnect";
import React from "react";
import DeployMenuItemsView from "./DeployMenuItemsView";

function DeployMenuItems() {
  const { toggleConnectModal } = useConnect();

  return <DeployMenuItemsView toggleConnectModal={toggleConnectModal} />;
}

export default DeployMenuItems;
