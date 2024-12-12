import type { FetchStatusResponseData } from "git/requests/fetchStatusRequest.types";
import React, { useMemo } from "react";
import type { StatusTreeStruct } from "./StatusTree";
import StatusTree from "./StatusTree";

const noopStatusTransformer = () => null;

interface DumbGitStatusProps {
  status: FetchStatusResponseData | null;
  statusTransformer: (
    status: FetchStatusResponseData,
  ) => StatusTreeStruct | null;
  isFetchStatusLoading: boolean;
}

export default function DumbGitStatus({
  isFetchStatusLoading = false,
  status = null,
  statusTransformer = noopStatusTransformer,
}: DumbGitStatusProps) {
  const statusTree = useMemo(() => {
    if (!status || isFetchStatusLoading) return null;

    statusTransformer(status);
  }, [isFetchStatusLoading, status, statusTransformer]);

  if (isFetchStatusLoading) {
    return <div>Loading...</div>;
  }

  if (!status || !statusTree) {
    return null;
  }

  return <StatusTree tree={statusTree} />;
}
