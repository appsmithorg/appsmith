import React from "react";
import GitQuickActions from "../GitQuickActions";
import { useGitContext } from "../GitContextProvider";
import useStatusChangeCount from "./hooks/useStatusChangeCount";

function CtxAwareGitQuickActions() {
  const {
    autocommitEnabled,
    autocommitPolling,
    connectPermitted,
    discard,
    discardLoading,
    fetchStatusLoading,
    gitConnected,
    protectedMode,
    pull,
    pullError,
    pullLoading,
    status,
    toggleGitConnectModal,
    toggleGitOpsModal,
    toggleGitSettingsModal,
  } = useGitContext();

  const isPullFailing = !!pullError;
  const isStatusClean = status?.isClean ?? false;
  const statusBehindCount = status?.behindCount ?? 0;
  const statusChangeCount = useStatusChangeCount(status);

  return (
    <GitQuickActions
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
      toggleGitConnectModal={toggleGitConnectModal}
      toggleGitOpsModal={toggleGitOpsModal}
      toggleGitSettingsModal={toggleGitSettingsModal}
    />
  );
}

export default CtxAwareGitQuickActions;
