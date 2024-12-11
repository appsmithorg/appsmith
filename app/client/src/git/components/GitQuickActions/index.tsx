import React from "react";
import DumbGitQuickActions from "./DumbGitQuickActions";
import { useGitContext } from "../GitContextProvider";
import useStatusChangeCount from "./hooks/useStatusChangeCount";

function GitQuickActions() {
  const {
    autocommitEnabled,
    autocommitPolling,
    discard,
    discardLoading,
    fetchStatusLoading,
    gitConnected,
    protectedMode,
    pull,
    pullError,
    pullLoading,
    status,
    toggleConnectModal,
    toggleOpsModal,
    toggleSettingsModal,
  } = useGitContext();

  const connectPermitted = true;
  const isPullFailing = !!pullError;
  const isStatusClean = status?.isClean ?? false;
  const statusBehindCount = status?.behindCount ?? 0;
  const statusChangeCount = useStatusChangeCount(status);

  return (
    <DumbGitQuickActions
      discard={discard}
      isAutocommitEnabled={autocommitEnabled}
      isAutocommitPolling={autocommitPolling}
      isConnectPermitted={connectPermitted}
      isDiscardLoading={discardLoading}
      isFetchStatusLoading={fetchStatusLoading}
      isGitConnected={gitConnected}
      isProtectedMode={protectedMode}
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

export default GitQuickActions;
