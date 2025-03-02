import { Flex, Icon, Text } from "@appsmith/ads";
import React from "react";
import styled from "styled-components";

const Container = styled(Flex)`
  border-radius: 4px;
  background-color: var(--ads-v2-color-gray-0);
`;

interface LatestCommitInfoViewProps {
  authorName: string | null;
  committedAt: string | null;
  hash: string | null;
  message: string | null;
}

function LatestCommitInfoView({
  authorName = null,
  committedAt = null,
  hash = null,
  message = null,
}: LatestCommitInfoViewProps) {
  return (
    <Container marginBottom="spaces-4" padding="spaces-3">
      <Flex flex={1} flexDirection="column" gap="spaces-3">
        <Text renderAs="p">{message}</Text>
        <Text kind="body-s" renderAs="p">
          {authorName} committed {committedAt}
        </Text>
      </Flex>
      <Flex alignItems="center" justifyContent="center">
        <Flex gap="spaces-2">
          <Icon name="git-commit" size="md" />
          <Text renderAs="p">{hash}</Text>
        </Flex>
      </Flex>
    </Container>
  );
}

export default LatestCommitInfoView;
