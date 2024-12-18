import React from "react";
import QuickActionsView from "./QuickActionsView";
import { useGitContext } from "../GitContextProvider";
import useStatusChangeCount from "./hooks/useStatusChangeCount";
import useProtectedBranches from "git/hooks/useProtectedBranches";
import useGitPermissions from "git/hooks/useGitPermissions";
import useAutocommit from "git/hooks/useAutocommit";
import useSettings from "git/hooks/useSettings";
import useMetadata from "git/hooks/useMetadata";

function QuickActions() {
  const {
    discard,
    discardLoading,
    fetchStatusLoading,
    pull,
    pullError,
    pullLoading,
    status,
    toggleConnectModal,
    toggleOpsModal,
  } = useGitContext();
  const { isGitConnected } = useMetadata();
  const { isProtectedMode } = useProtectedBranches();
  const { isConnectPermitted } = useGitPermissions();
  const { isAutocommitEnabled, isAutocommitPolling } = useAutocommit();
  const { toggleSettingsModal } = useSettings();

  const isPullFailing = !!pullError;
  const isStatusClean = status?.isClean ?? false;
  const statusBehindCount = status?.behindCount ?? 0;
  const statusChangeCount = useStatusChangeCount(status);

  return (
    <QuickActionsView
      discard={discard}
      isAutocommitEnabled={isAutocommitEnabled}
      isAutocommitPolling={isAutocommitPolling}
      isConnectPermitted={isConnectPermitted}
      isDiscardLoading={discardLoading}
      isFetchStatusLoading={fetchStatusLoading}
      isGitConnected={isGitConnected}
      isProtectedMode={isProtectedMode}
      isPullFailing={isPullFailing}
      isPullLoading={pullLoading}
      isStatusClean={isStatusClean}
      pull={pull}
      statusBehindCount={statusBehindCount}
      statusChangeCount={statusChangeCount}
      toggleConnectModal={toggleConnectModal}
      toggleOpsModal={toggleOpsModal}
      toggleSettingsModal={toggleSettingsModal}
    />
  );
}

export default QuickActions;
