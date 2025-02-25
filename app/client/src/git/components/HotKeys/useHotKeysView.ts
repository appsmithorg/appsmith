import { GitOpsTab } from "git/constants/enums";
import noop from "lodash/noop";
import { useCallback } from "react";

interface HotKeysViewProps {
  toggleOpsModal: (show: boolean, tab?: GitOpsTab.Deploy) => void;
}

export function useHotKeysView({ toggleOpsModal = noop }: HotKeysViewProps) {
  const handleCommitModal = useCallback(() => {
    toggleOpsModal(true, GitOpsTab.Deploy);
  }, [toggleOpsModal]);

  return [
    {
      combo: "ctrl + shift + g",
      global: true,
      label: "Show git commit modal",
      onKeyDown: handleCommitModal,
    },
  ];
}
