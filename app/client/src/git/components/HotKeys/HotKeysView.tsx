import { Hotkey } from "@blueprintjs/core";
import { GitOpsTab } from "git/constants/enums";
import noop from "lodash/noop";
import React, { useCallback } from "react";

interface HotKeysViewProps {
  toggleOpsModal: (show: boolean, tab?: GitOpsTab.Deploy) => void;
}

function HotKeysView({ toggleOpsModal = noop }: HotKeysViewProps) {
  const handleCommitModal = useCallback(() => {
    toggleOpsModal(true, GitOpsTab.Deploy);
  }, [toggleOpsModal]);

  return (
    <Hotkey
      combo="ctrl + shift + g"
      global
      label="Show git commit modal"
      onKeyDown={handleCommitModal}
    />
  );
}

export default HotKeysView;
