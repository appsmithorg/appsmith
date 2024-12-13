import React, { useCallback, useMemo } from "react";
import styled from "styled-components";
import {
  createMessage,
  GIT_CONFLICTING_INFO,
  LEARN_MORE,
  OPEN_REPO,
} from "ee/constants/messages";
import { Button, Callout } from "@appsmith/ads";

const Row = styled.div`
  display: flex;
  align-items: center;
`;

const StyledButton = styled(Button)`
  margin-right: ${(props) => props.theme.spaces[3]}px;
`;

const StyledCallout = styled(Callout)`
  margin-bottom: 12px;
`;

const ConflictInfoContainer = styled.div`
  margin-top: ${(props) => props.theme.spaces[7]}px;
  margin-bottom: ${(props) => props.theme.spaces[7]}px;
`;

interface ConflictErrorViewProps {
  learnMoreUrl: string;
  repoUrl: string;
}

export default function ConflictErrorView({
  learnMoreUrl,
  repoUrl,
}: ConflictErrorViewProps) {
  const handleClickOnOpenRepo = useCallback(() => {
    window.open(repoUrl, "_blank", "noopener,noreferrer");
  }, [repoUrl]);

  const calloutLinks = useMemo(
    () => [
      {
        children: createMessage(LEARN_MORE),
        to: learnMoreUrl,
      },
    ],
    [learnMoreUrl],
  );

  return (
    <ConflictInfoContainer data-testid="t--conflict-info-container">
      <StyledCallout
        data-testid="t--conflict-info-error-warning"
        kind="error"
        links={calloutLinks}
      >
        {createMessage(GIT_CONFLICTING_INFO)}
      </StyledCallout>
      <Row>
        <StyledButton
          data-testid="t--git-repo-button"
          kind="secondary"
          onClick={handleClickOnOpenRepo}
        >
          {createMessage(OPEN_REPO)}
        </StyledButton>
      </Row>
    </ConflictInfoContainer>
  );
}
