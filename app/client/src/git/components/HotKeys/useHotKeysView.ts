import { GitOpsTab } from "git/constants/enums";
import noop from "lodash/noop";
import { useCallback, useMemo } from "react";

interface HotKeysViewProps {
  toggleOpsModal: (show: boolean, tab?: GitOpsTab.Deploy) => void;
}

export function useHotKeysView({ toggleOpsModal = noop }: HotKeysViewProps) {
  const handleCommitModal = useCallback(() => {
    toggleOpsModal(true, GitOpsTab.Deploy);
  }, [toggleOpsModal]);

  const hotKeys = useMemo(
    () => [
      {
        combo: "ctrl + shift + g",
        global: true,
        label: "Show git commit modal",
        onKeyDown: handleCommitModal,
      },
    ],
    [handleCommitModal],
  );

  return hotKeys;
}
