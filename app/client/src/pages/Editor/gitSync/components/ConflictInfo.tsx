import React from "react";
import styled from "styled-components";
import { Text, TextType } from "design-system";
import InfoWrapper from "./InfoWrapper";
import Link from "./Link";
import {
  createMessage,
  GIT_CONFLICTING_INFO,
  LEARN_MORE,
  OPEN_REPO,
} from "@appsmith/constants/messages";
import Button, { Category, Size } from "components/ads/Button";
import Icon, { IconSize } from "components/ads/Icon";
import { Colors } from "constants/Colors";

const Row = styled.div`
  display: flex;
  align-items: center;
`;

const OpenRepoButton = styled(Button)`
  margin-right: ${(props) => props.theme.spaces[3]}px;
`;

type Props = {
  browserSupportedRemoteUrl: string;
  learnMoreLink: string;
};

const ConflictInfoContainer = styled.div`
  margin-top: ${(props) => props.theme.spaces[7]}px;
  margin-bottom: ${(props) => props.theme.spaces[7]}px;
`;

export default function ConflictInfo({
  browserSupportedRemoteUrl,
  learnMoreLink,
}: Props) {
  return (
    <ConflictInfoContainer data-testid="t--conflict-info-container">
      <InfoWrapper data-testid="t--conflict-info-error-warning" isError>
        <Icon fillColor={Colors.CRIMSON} name="info" size={IconSize.XXXL} />
        <div style={{ display: "block" }}>
          <Text color={Colors.CRIMSON} type={TextType.P3}>
            {createMessage(GIT_CONFLICTING_INFO)}
          </Text>
          <Link
            color={Colors.CRIMSON}
            link={learnMoreLink}
            text={createMessage(LEARN_MORE)}
          />
        </div>
      </InfoWrapper>
      <Row>
        <OpenRepoButton
          category={Category.tertiary}
          className="t--commit-button"
          href={browserSupportedRemoteUrl}
          size={Size.large}
          tag="a"
          target="_blank"
          text={createMessage(OPEN_REPO)}
          width="max-content"
        />
      </Row>
    </ConflictInfoContainer>
  );
}
