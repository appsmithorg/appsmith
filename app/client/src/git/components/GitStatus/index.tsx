import React from "react";
import { useGitContext } from "../GitContextProvider";
import DumbGitStatus from "./DumbGitStatus";

function GitStatus() {
  const { fetchStatusLoading, status, statusTransformer } = useGitContext();

  return (
    <DumbGitStatus
      isFetchStatusLoading={fetchStatusLoading}
      status={status}
      statusTransformer={statusTransformer}
    />
  );
}

export default GitStatus;
