import type { FetchStatusResponseData } from "git/requests/fetchStatusRequest.types";
import React, { useMemo } from "react";
import StatusTree from "./StatusTree";
import { Callout, Text } from "@appsmith/ads";
import { createMessage } from "@appsmith/ads-old";
import {
  CHANGES_SINCE_LAST_DEPLOYMENT,
  FETCH_GIT_STATUS,
} from "ee/constants/messages";
import StatusLoader from "./StatusLoader";
import type { StatusTreeStruct } from "./types";
import styled from "styled-components";

const CalloutContainer = styled.div`
  margin-top: 16px;
`;

const noopStatusTransformer = () => null;

interface StatusChangesViewProps {
  status: FetchStatusResponseData | null;
  statusTransformer: (
    status: FetchStatusResponseData,
  ) => StatusTreeStruct[] | null;
  isFetchStatusLoading: boolean;
}

export default function StatusChangesView({
  isFetchStatusLoading = false,
  status = null,
  statusTransformer = noopStatusTransformer,
}: StatusChangesViewProps) {
  const statusTree = useMemo(() => {
    if (!status || isFetchStatusLoading) return null;

    return statusTransformer(status);
  }, [isFetchStatusLoading, status, statusTransformer]);

  if (isFetchStatusLoading) {
    return <StatusLoader loaderMsg={createMessage(FETCH_GIT_STATUS)} />;
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
      {status.migrationMessage ? (
        <CalloutContainer>
          <Callout kind="info">{status.migrationMessage}</Callout>
        </CalloutContainer>
      ) : null}
    </div>
  );
}
