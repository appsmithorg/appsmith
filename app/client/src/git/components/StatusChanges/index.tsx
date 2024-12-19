import React from "react";
import { useGitContext } from "../GitContextProvider";
import StatusChangesView from "./StatusChangesView";
import useStatus from "git/hooks/useStatus";

function StatusChanges() {
  const { statusTransformer } = useGitContext();
  const { isFetchStatusLoading, status } = useStatus();

  return (
    <StatusChangesView
      isFetchStatusLoading={isFetchStatusLoading}
      status={status}
      statusTransformer={statusTransformer}
    />
  );
}

export default StatusChanges;
