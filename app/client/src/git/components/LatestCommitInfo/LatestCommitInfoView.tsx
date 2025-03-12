import { Flex, Icon, Spinner, Text } from "@appsmith/ads";
import { LATEST_COMMIT_INFO } from "git/ee/constants/messages";
import React from "react";
import styled from "styled-components";
import { howMuchTimeBeforeText } from "utils/helpers";

const Container = styled(Flex)`
  border-radius: 4px;
  background-color: var(--ads-v2-color-gray-0);
`;

interface LatestCommitInfoViewProps {
  authorName: string | null;
  committedAt: number | null;
  hash: string | null;
  isLoading: boolean;
  message: string | null;
}

function LatestCommitInfoView({
  authorName = null,
  committedAt = null,
  hash = null,
  isLoading = false,
  message = null,
}: LatestCommitInfoViewProps) {
  const readableCommittedAt = committedAt
    ? howMuchTimeBeforeText(new Date(committedAt * 1000).toString())
    : null;

  if (isLoading) {
    return (
      <Container
        alignItems="center"
        data-testid="t--git-latest-commit-loading"
        gap="spaces-3"
        marginBottom="spaces-4"
        padding="spaces-3"
      >
        <Spinner size="md" />
        <Text renderAs="p">{LATEST_COMMIT_INFO.LOADING_COMMIT_MESSAGE}</Text>
      </Container>
    );
  }

  return (
    <Container marginBottom="spaces-4" padding="spaces-3">
      <Flex flex={1} flexDirection="column" gap="spaces-3">
        <Text data-testid="t--git-latest-commit-message" renderAs="p">
          {message ?? <em>{LATEST_COMMIT_INFO.NO_COMMIT_MESSAGE}</em>}
        </Text>
        {authorName && (
          <Text
            data-testid="t--git-latest-commit-commited-by"
            kind="body-s"
            renderAs="p"
          >
            {authorName && !readableCommittedAt
              ? `Committed by ${authorName}`
              : null}
            {authorName && readableCommittedAt
              ? `${authorName} committed ${readableCommittedAt} ago`
              : null}
          </Text>
        )}
      </Flex>
      <Flex alignItems="center" justifyContent="center">
        <Flex gap="spaces-2">
          <Icon name="git-commit" size="md" />
          <Text data-testid="t--git-latest-commit-hash" renderAs="p">
            {hash ?? "-"}
          </Text>
        </Flex>
      </Flex>
    </Container>
  );
}

export default LatestCommitInfoView;
