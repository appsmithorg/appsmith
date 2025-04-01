import { Flex, Icon, Spinner, Text } from "@appsmith/ads";
import { LATEST_COMMIT_INFO } from "git/ee/constants/messages";
import React from "react";
import styled from "styled-components";
import { howMuchTimeBeforeText } from "utils/helpers";

const TitleText = styled(Text)`
  font-weight: 500;
`;

const MutedText = styled(Text)`
  font-weight: 300;
`;

const LoadingContainer = styled(Flex)`
  margin-bottom: 19px;
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

  return (
    <Flex flexDirection="column" gap="spaces-3" marginBottom="spaces-6">
      <TitleText data-testid="t--git-release-version-title" renderAs="p">
        {LATEST_COMMIT_INFO.TITLE}
      </TitleText>
      {isLoading && (
        <LoadingContainer
          alignItems="center"
          data-testid="t--git-latest-commit-loading"
          gap="spaces-3"
        >
          <Spinner size="md" />
          <Text renderAs="p">{LATEST_COMMIT_INFO.LOADING_COMMIT_MESSAGE}</Text>
        </LoadingContainer>
      )}
      {!isLoading && (
        <Flex>
          <Flex flex={1} flexDirection="column" gap="spaces-2">
            <Text
              data-testid="t--git-latest-commit-message"
              kind="body-s"
              renderAs="p"
            >
              {message ?? <em>{LATEST_COMMIT_INFO.NO_COMMIT_MESSAGE}</em>}
            </Text>
            {authorName && (
              <MutedText
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
              </MutedText>
            )}
          </Flex>
          <Flex alignItems="center" justifyContent="center">
            <Flex gap="spaces-2">
              <Icon name="git-commit" size="md" />
              <MutedText
                data-testid="t--git-latest-commit-hash"
                kind="body-s"
                renderAs="p"
              >
                {hash ?? "-"}
              </MutedText>
            </Flex>
          </Flex>
        </Flex>
      )}
    </Flex>
  );
}

export default LatestCommitInfoView;
