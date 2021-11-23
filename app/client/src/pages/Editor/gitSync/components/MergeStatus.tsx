import React from "react";
import {
  createMessage,
  FETCH_MERGE_STATUS,
  // FETCH_MERGE_STATUS_FAILURE,
  MERGE_CONFLICT_ERROR,
  NO_MERGE_CONFLICT,
} from "constants/messages";
import styled from "constants/DefaultTheme";
import StatusLoader from "./StatusLoader";
import { Space } from "./StyledComponents";
import { useSelector } from "react-redux";
import {
  getIsFetchingMergeStatus,
  getMergeStatus,
} from "selectors/gitSyncSelectors";
import Text, { TextType } from "components/ads/Text";
import ErrorWarning from "remixicon-react/ErrorWarningLineIcon";
import CheckLine from "remixicon-react/CheckLineIcon";
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
  const mergeStatus = useSelector(getMergeStatus);

  let status = MERGE_STATUS_STATE.NONE;
  if (isFetchingMergeStatus) {
    status = MERGE_STATUS_STATE.FETCHING;
  } else if (mergeStatus && mergeStatus?.isMergeAble) {
    status = MERGE_STATUS_STATE.NO_CONFLICT;
  } else if (mergeStatus && !mergeStatus?.isMergeAble) {
    status = MERGE_STATUS_STATE.MERGE_CONFLICT;
  }

  switch (status) {
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
            <CheckLine color={Colors.GREEN} size={18} />
            <Text
              color={Colors.GREEN}
              style={{ marginLeft: 8, alignSelf: "center" }}
              type={TextType.P3}
              weight="600"
            >
              {createMessage(NO_MERGE_CONFLICT)}
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

    // case MERGE_STATUS_STATE.NONE:
    //   return (
    //     <Flex>
    //       <Space horizontal size={10} />
    //       <Wrapper>
    //         <ErrorWarning size={18} />
    //         <Text
    //           style={{ marginLeft: 8, alignSelf: "center" }}
    //           type={TextType.P3}
    //         >
    //           {createMessage(FETCH_MERGE_STATUS_FAILURE)}
    //         </Text>
    //       </Wrapper>
    //     </Flex>
    //   );
    default:
      return null;
    // status === MERGE_STATUS_STATE.NONE will execute default case.
  }
}

export default MergeStatus;
