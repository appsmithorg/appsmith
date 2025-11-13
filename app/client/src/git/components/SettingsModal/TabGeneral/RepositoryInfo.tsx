import React, { useCallback } from "react";
import styled from "styled-components";
import { Text, Icon } from "@appsmith/ads";
import useMetadata from "git/hooks/useMetadata";

const Header = styled.div`
  margin-bottom: ${(props) => props.theme.spaces[3]}px;
`;

const RepositoryLinkContainer = styled.a`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spaces[2]}px;
  padding: ${(props) => props.theme.spaces[4]}px;
  background: var(--ads-v2-color-bg-subtle);
  border: 1px solid var(--ads-v2-color-border);
  border-radius: var(--ads-v2-border-radius);
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    background: var(--ads-v2-color-bg-muted);
    border-color: var(--ads-v2-color-border-emphasis);
  }
`;

const RepositoryDetails = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spaces[1]}px;
`;

const RepositoryName = styled(Text)`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

function RepositoryInfo() {
  const { metadata } = useMetadata();

  const browserSupportedUrl =
    metadata?.browserSupportedRemoteUrl ||
    metadata?.browserSupportedUrl ||
    null;
  const repoName = metadata?.repoName || null;
  const remoteUrl = metadata?.remoteUrl || null;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();

      if (browserSupportedUrl) {
        window.open(browserSupportedUrl, "_blank", "noopener,noreferrer");
      }
    },
    [browserSupportedUrl],
  );

  if (!browserSupportedUrl && !repoName && !remoteUrl) {
    return null;
  }

  return (
    <div className="px-0 mb-4">
      <Header>
        <Text kind="heading-xs">Repository</Text>
      </Header>
      {browserSupportedUrl && (
        <RepositoryLinkContainer
          data-testid="t--git-settings-repo-link"
          href={browserSupportedUrl}
          onClick={handleClick}
          rel="noopener noreferrer"
          target="_blank"
        >
          <Icon name="git-repository" size="md" />
          <RepositoryDetails>
            {repoName && (
              <RepositoryName kind="body-m">{repoName}</RepositoryName>
            )}
          </RepositoryDetails>
          <Icon name="share-box-line" size="sm" />
        </RepositoryLinkContainer>
      )}
    </div>
  );
}

export default RepositoryInfo;
