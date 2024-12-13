import React from "react";
import QuickActionsView from "./QuickActionsView";
import { useGitContext } from "../GitContextProvider";
import useStatusChangeCount from "./hooks/useStatusChangeCount";
import useProtectedBranches from "git/hooks/useProtectedBranches";
import useGitPermissions from "git/hooks/useGitPermissions";

function QuickActions() {
  const {
    autocommitEnabled,
    autocommitPolling,
    discard,
    discardLoading,
    fetchStatusLoading,
    gitConnected,
    pull,
    pullError,
    pullLoading,
    status,
    toggleConnectModal,
    toggleOpsModal,
    toggleSettingsModal,
  } = useGitContext();
  const { isProtectedMode } = useProtectedBranches();
  const { isConnectPermitted } = useGitPermissions();

  const isPullFailing = !!pullError;
  const isStatusClean = status?.isClean ?? false;
  const statusBehindCount = status?.behindCount ?? 0;
  const statusChangeCount = useStatusChangeCount(status);

  return (
    <QuickActionsView
      discard={discard}
      isAutocommitEnabled={autocommitEnabled}
      isAutocommitPolling={autocommitPolling}
      isConnectPermitted={isConnectPermitted}
      isDiscardLoading={discardLoading}
      isFetchStatusLoading={fetchStatusLoading}
      isGitConnected={gitConnected}
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
