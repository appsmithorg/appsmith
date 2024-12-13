import React from "react";
import { useGitContext } from "../GitContextProvider";
import StatusChangesView from "./StatusChangesView";

function StatusChanges() {
  const { fetchStatusLoading, status, statusTransformer } = useGitContext();

  return (
    <StatusChangesView
      isFetchStatusLoading={fetchStatusLoading}
      status={status}
      statusTransformer={statusTransformer}
    />
  );
}

export default StatusChanges;
