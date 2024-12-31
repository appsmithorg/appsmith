import React from "react";
import HotKeysView from "./HotKeysView";
import useOps from "git/hooks/useOps";

function HotKeys() {
  const { toggleOpsModal } = useOps();

  return <HotKeysView toggleOpsModal={toggleOpsModal} />;
}

export default HotKeys;
