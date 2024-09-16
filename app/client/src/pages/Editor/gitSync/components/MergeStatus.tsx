import React from "react";
import styled from "styled-components";
import StatusLoader from "./StatusLoader";
import { Icon, Text } from "@appsmith/ads";

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
  width: 45%;
  align-items: flex-start;
  gap: 5px;
  .ads-v2-icon {
    margin-top: 3px;
  }
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
            <Text color="var(--ads-v2-color-fg-success)" kind="body-m">
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
            <Icon
              color="var(--ads-v2-color-fg-error)"
              name="alert-line"
              size="md"
            />
            <Text color="var(--ads-v2-color-fg-error)" kind="body-m">
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
