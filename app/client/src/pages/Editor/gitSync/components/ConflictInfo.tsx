import React from "react";
import styled from "styled-components";
import {
  createMessage,
  GIT_CONFLICTING_INFO,
  LEARN_MORE,
  OPEN_REPO,
} from "ee/constants/messages";
import { Button, Callout } from "@appsmith/ads";
import { Space } from "./StyledComponents";

const Row = styled.div`
  display: flex;
  align-items: center;
`;

const StyledButton = styled(Button)`
  margin-right: ${(props) => props.theme.spaces[3]}px;
`;

interface Props {
  browserSupportedRemoteUrl: string;
  learnMoreLink: string;
}

const ConflictInfoContainer = styled.div`
  margin-top: ${(props) => props.theme.spaces[7]}px;
  margin-bottom: ${(props) => props.theme.spaces[7]}px;
`;

export default function ConflictInfo({
  browserSupportedRemoteUrl,
  learnMoreLink,
}: Props) {
  const handleClickOnOpenRepo = () => {
    window.open(browserSupportedRemoteUrl, "_blank");
  };

  return (
    <ConflictInfoContainer data-testid="t--conflict-info-container">
      <Callout
        data-testid="t--conflict-info-error-warning"
        kind="error"
        links={[
          {
            children: createMessage(LEARN_MORE),
            to: learnMoreLink,
          },
        ]}
      >
        {createMessage(GIT_CONFLICTING_INFO)}
      </Callout>
      <Space size={3} />
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
