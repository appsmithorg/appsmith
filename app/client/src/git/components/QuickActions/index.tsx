import React from "react";
import QuickActionsView from "./QuickActionsView";
import useStatusChangeCount from "./hooks/useStatusChangeCount";
import useAutocommit from "git/hooks/useAutocommit";
import useSettings from "git/hooks/useSettings";
import useConnect from "git/hooks/useConnect";
import useDiscard from "git/hooks/useDiscard";
import usePull from "git/hooks/usePull";
import useStatus from "git/hooks/useStatus";
import useOps from "git/hooks/useOps";
import useBranches from "git/hooks/useBranches";
import useConnected from "git/hooks/useConnected";
import useProtectedMode from "git/hooks/useProtectedMode";
import useInit from "git/hooks/useInit";
import { useGitContext } from "../GitContextProvider";

function QuickActions() {
  const { isConnectPermitted } = useGitContext();
  const isConnected = useConnected();
  const { toggleOpsModal } = useOps();
  const { isFetchStatusLoading, status } = useStatus();
  const { isPullLoading, pull, pullError } = usePull();
  const { discard, isDiscardLoading } = useDiscard();
  const isProtectedMode = useProtectedMode();
  const {
    isAutocommitEnabled,
    isAutocommitPolling,
    isTriggerAutocommitLoading,
  } = useAutocommit();
  const { toggleSettingsModal } = useSettings();
  const { toggleConnectModal } = useConnect();
  const { currentBranch, isBranchPopupOpen, toggleBranchPopup } = useBranches();
  const { isInitialized } = useInit();

  const isPullFailing = !!pullError;
  const isStatusClean = status?.isClean ?? true;
  const statusBehindCount = status?.behindCount ?? 0;
  const statusChangeCount = useStatusChangeCount(status);

  return (
    <QuickActionsView
      currentBranch={currentBranch}
      discard={discard}
      isAutocommitEnabled={isAutocommitEnabled}
      isAutocommitPolling={isAutocommitPolling}
      isBranchPopupOpen={isBranchPopupOpen}
      isConnectPermitted={isConnectPermitted}
      isConnected={isConnected}
      isDiscardLoading={isDiscardLoading}
      isFetchStatusLoading={isFetchStatusLoading}
      isInitialized={isInitialized}
      isProtectedMode={isProtectedMode}
      isPullFailing={isPullFailing}
      isPullLoading={isPullLoading}
      isStatusClean={isStatusClean}
      isTriggerAutocommitLoading={isTriggerAutocommitLoading}
      pull={pull}
      statusBehindCount={statusBehindCount}
      statusChangeCount={statusChangeCount}
      toggleBranchPopup={toggleBranchPopup}
      toggleConnectModal={toggleConnectModal}
      toggleOpsModal={toggleOpsModal}
      toggleSettingsModal={toggleSettingsModal}
    />
  );
}

export default QuickActions;
