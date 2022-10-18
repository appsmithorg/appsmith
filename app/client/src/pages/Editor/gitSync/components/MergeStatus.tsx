import React from "react";
import styled from "constants/DefaultTheme";
import StatusLoader from "./StatusLoader";
import { Text, TextType } from "design-system";
import { Colors } from "constants/Colors";
import { Classes } from "components/ads";

const Flex = styled.div`
  display: flex;

  & ${Classes.TEXT} {
    align-self: center;
  }
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
            <Text color={Colors.GREEN} type={TextType.P3} weight="600">
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
            <Text color={Colors.CRIMSON} type={TextType.P3} weight="600">
              {message}
            </Text>
          </Wrapper>
        </Flex>
      );
    default:
      return null;
  }
}

export default MergeStatus;
