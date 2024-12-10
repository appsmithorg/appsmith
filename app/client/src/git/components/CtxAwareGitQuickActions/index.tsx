import React from "react";
import GitQuickActions from "../GitQuickActions";
import { useGitContext } from "../GitContextProvider";
import useStatusChangeCount from "./hooks/useStatusChangeCount";

function CtxAwareGitQuickActions() {
  const {
    discard,
    discardLoading,
    fetchStatusLoading,
    pull,
    pullError,
    pullLoading,
    status,
    toggleGitConnectModal,
    toggleGitOpsModal,
    toggleGitSettingsModal,
  } = useGitContext();

  const isGitConnected = false;
  const isAutocommitEnabled = true;
  const isAutocommitPolling = false;
  const isConnectPermitted = true;
  const isProtectedMode = false;

  const isPullFailing = !!pullError;
  const isStatusClean = status?.isClean ?? false;
  const statusBehindCount = status?.behindCount ?? 0;
  const statusChangeCount = useStatusChangeCount(status);

  return (
    <GitQuickActions
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
      toggleGitConnectModal={toggleGitConnectModal}
      toggleGitOpsModal={toggleGitOpsModal}
      toggleGitSettingsModal={toggleGitSettingsModal}
    />
  );
}

export default CtxAwareGitQuickActions;
