import React from "react";
import styled from "constants/DefaultTheme";
import StatusLoader from "./StatusLoader";
import Text, { TextType } from "components/ads/Text";
import ErrorWarning from "remixicon-react/ErrorWarningLineIcon";
import CheckLine from "remixicon-react/CheckLineIcon";
import { Colors } from "constants/Colors";

const Flex = styled.div`
  display: flex;
`;

export const MERGE_STATUS_STATE = {
  FETCHING: "FETCHING",
  MERGEABLE: "MERGEABLE",
  NOT_MERGEABLE: "NOT_MERGEABLE",
  NONE: "NONE",
  ERROR: "ERROR",
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  margin-top: ${(props) => `${props.theme.spaces[3]}px`};
`;

function MergeStatus({
  message = "",
  status,
}: {
  status: string;
  message?: string;
}) {
  switch (status) {
    case MERGE_STATUS_STATE.FETCHING:
      return (
        <Flex>
          <StatusLoader loaderMsg={message} />
        </Flex>
      );
    case MERGE_STATUS_STATE.MERGEABLE:
      return (
        <Flex>
          <Wrapper>
            <CheckLine color={Colors.GREEN} size={18} />
            <Text
              color={Colors.GREEN}
              style={{ marginLeft: 8, alignSelf: "center" }}
              type={TextType.P3}
              weight="600"
            >
              {message}
            </Text>
          </Wrapper>
        </Flex>
      );
    case MERGE_STATUS_STATE.NOT_MERGEABLE:
    case MERGE_STATUS_STATE.ERROR:
      return (
        <Flex>
          <Wrapper>
            <ErrorWarning color={Colors.CRIMSON} size={18} />
            <Text
              color={Colors.CRIMSON}
              style={{ marginLeft: 8, alignSelf: "center" }}
              type={TextType.P3}
              weight="600"
            >
              {message}
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
