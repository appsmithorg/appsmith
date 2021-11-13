import React from "react";
import {
  createMessage,
  FETCH_MERGE_STATUS,
  MERGE_CONFLICT_ERROR,
} from "constants/messages";
import styled from "constants/DefaultTheme";
import StatusLoader from "./StatusLoader";
import { Space } from "./StyledComponents";
import { useSelector } from "react-redux";
import { getIsFetchingMergeStatus } from "selectors/gitSyncSelectors";
import Text, { TextType } from "components/ads/Text";
import ErrorWarning from "remixicon-react/ErrorWarningLineIcon";
import { Colors } from "constants/Colors";

const Flex = styled.div`
  display: flex;
`;

const MERGE_STATUS_STATE = {
  FETCHING: "FETCHING",
  NO_CONFLICT: "NO_CONFLICT",
  MERGE_CONFLICT: "MERGE_CONFLICT",
  NONE: "NONE",
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  margin-top: ${(props) => `${props.theme.spaces[3]}px`};
`;

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
          <Wrapper>
            <Text style={{ marginLeft: 8 }} type={TextType.P3}>
              {createMessage(FETCH_MERGE_STATUS)}
            </Text>
          </Wrapper>
        </Flex>
      );
    case MERGE_STATUS_STATE.MERGE_CONFLICT:
      return (
        <Flex>
          <Space horizontal size={10} />
          <Wrapper>
            <ErrorWarning color={Colors.CRIMSON} size={18} />
            <Text
              color={Colors.CRIMSON}
              style={{ marginLeft: 8, alignSelf: "center" }}
              type={TextType.P3}
              weight="600"
            >
              {createMessage(MERGE_CONFLICT_ERROR)}
            </Text>
          </Wrapper>
        </Flex>
      );
    default:
      return null;
  }
}

export default MergeStatus;
