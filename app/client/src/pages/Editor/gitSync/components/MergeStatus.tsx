import React from "react";
import { createMessage, FETCH_MERGE_STATUS } from "constants/messages";
import styled from "constants/DefaultTheme";
import StatusLoader from "./StatusLoader";
import { Space } from "./StyledComponents";
import { useSelector } from "react-redux";
import { getIsFetchingMergeStatus } from "selectors/gitSyncSelectors";

const Flex = styled.div`
  display: flex;
`;

const MERGE_STATUS_STATE = {
  FETCHING: "FETCHING",
  NO_CONFLICT: "NO_CONFLICT",
  MERGE_CONFLICT: "MERGE_CONFLICT",
  NONE: "NONE",
};

function MergeStatus() {
  const isFetchingMergeStatus = useSelector(getIsFetchingMergeStatus);
  const mergeStatus = isFetchingMergeStatus
    ? MERGE_STATUS_STATE.FETCHING
    : MERGE_STATUS_STATE.NONE;

  switch (mergeStatus) {
    case MERGE_STATUS_STATE.FETCHING:
      return (
        <Flex>
          <Space horizontal size={10} />
          <StatusLoader loaderMsg={createMessage(FETCH_MERGE_STATUS)} />
        </Flex>
      );
    case MERGE_STATUS_STATE.NO_CONFLICT:
      return (
        <Flex>
          <Space horizontal size={10} />
          <StatusLoader loaderMsg={createMessage(FETCH_MERGE_STATUS)} />
        </Flex>
      );
    case MERGE_STATUS_STATE.MERGE_CONFLICT:
      return (
        <Flex>
          <Space horizontal size={10} />
          <StatusLoader loaderMsg={createMessage(FETCH_MERGE_STATUS)} />
        </Flex>
      );
    default:
      return null;
  }
}

export default MergeStatus;
