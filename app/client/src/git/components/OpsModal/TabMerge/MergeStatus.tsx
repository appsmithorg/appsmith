import React from "react";
import styled from "styled-components";
import { Icon, Spinner, Text } from "@appsmith/ads";
import { MergeStatusState } from "git/constants/enums";

const LoaderWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: ${(props) => `${props.theme.spaces[3]}px`};
`;

const Flex = styled.div`
  display: flex;
`;

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
  message: string | null;
}) {
  switch (status) {
    case MergeStatusState.FETCHING:
      return (
        <LoaderWrapper>
          <Spinner size="md" />
          <Text kind={"body-m"} style={{ marginLeft: 8 }}>
            {message}
          </Text>
        </LoaderWrapper>
      );
    case MergeStatusState.MERGEABLE:
      return (
        <Flex>
          <Wrapper>
            <Text color="var(--ads-v2-color-fg-success)" kind="body-m">
              {message}
            </Text>
          </Wrapper>
        </Flex>
      );
    case MergeStatusState.NOT_MERGEABLE:
    case MergeStatusState.ERROR:
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
