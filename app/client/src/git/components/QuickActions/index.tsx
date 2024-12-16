import React from "react";
import QuickActionsView from "./QuickActionsView";
import { useGitContext } from "../GitContextProvider";
import useStatusChangeCount from "./hooks/useStatusChangeCount";

function QuickActions() {
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
    <QuickActionsView
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

export default QuickActions;
