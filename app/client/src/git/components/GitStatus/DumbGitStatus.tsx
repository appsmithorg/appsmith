import type { FetchStatusResponseData } from "git/requests/fetchStatusRequest.types";
import React, { useMemo } from "react";
import type { StatusTreeStruct } from "./StatusTree";
import StatusTree from "./StatusTree";
import { Text } from "@appsmith/ads";
import { createMessage } from "@appsmith/ads-old";
import { CHANGES_SINCE_LAST_DEPLOYMENT } from "ee/constants/messages";

const noopStatusTransformer = () => null;

interface DumbGitStatusProps {
  status: FetchStatusResponseData | null;
  statusTransformer: (
    status: FetchStatusResponseData,
  ) => StatusTreeStruct[] | null;
  isFetchStatusLoading: boolean;
}

export default function DumbGitStatus({
  isFetchStatusLoading = false,
  status = null,
  statusTransformer = noopStatusTransformer,
}: DumbGitStatusProps) {
  const statusTree = useMemo(() => {
    if (!status || isFetchStatusLoading) return null;

    return statusTransformer(status);
  }, [isFetchStatusLoading, status, statusTransformer]);

  if (isFetchStatusLoading) {
    return <div>Loading...</div>;
  }

  if (!status || status.isClean || !statusTree) {
    return null;
  }

  return (
    <div>
      <Text
        color={"var(--ads-v2-color-fg-emphasis)"}
        data-testid={"t--git-deploy-change-reason-text"}
        kind="heading-s"
      >
        {createMessage(CHANGES_SINCE_LAST_DEPLOYMENT)}
      </Text>
      <StatusTree tree={statusTree} />
    </div>
  );
}
