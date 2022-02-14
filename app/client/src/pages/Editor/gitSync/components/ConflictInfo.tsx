import React from "react";
import styled, { useTheme } from "styled-components";
import Text, { TextType } from "components/ads/Text";
import InfoWrapper from "./InfoWrapper";
import Link from "./Link";
import {
  createMessage,
  GIT_CONFLICTING_INFO,
  LEARN_MORE,
  OPEN_REPO,
} from "@appsmith/constants/messages";
import { Theme } from "constants/DefaultTheme";
import Button, { Category, Size } from "components/ads/Button";
import { useSelector } from "store";
import { getCurrentAppGitMetaData } from "selectors/applicationSelectors";
import Icon, { IconSize } from "components/ads/Icon";
import { Colors } from "constants/Colors";

const Row = styled.div`
  display: flex;
  align-items: center;
`;

const OpenRepoButton = styled(Button)`
  margin-right: ${(props) => props.theme.spaces[3]}px;
`;

type CIPropType = {
  isConflicting?: boolean;
  learnMoreLink: string;
};

export default function ConflictInfo(props: CIPropType) {
  const { isConflicting } = props;
  const theme = useTheme() as Theme;
  const gitMetaData = useSelector(getCurrentAppGitMetaData);
  return isConflicting ? (
    <>
      <InfoWrapper isError>
        <Icon fillColor={Colors.CRIMSON} name="info" size={IconSize.XXXL} />
        <div style={{ display: "block" }}>
          <Text
            color={Colors.CRIMSON}
            style={{ marginRight: theme.spaces[2] }}
            type={TextType.P3}
          >
            {createMessage(GIT_CONFLICTING_INFO)}
          </Text>
          <Link
            color={Colors.CRIMSON}
            link={props.learnMoreLink as string}
            text={createMessage(LEARN_MORE)}
          />
        </div>
      </InfoWrapper>
      <Row>
        <OpenRepoButton
          category={Category.tertiary}
          className="t--commit-button"
          href={gitMetaData?.browserSupportedRemoteUrl}
          size={Size.large}
          tag="a"
          target="_blank"
          text={createMessage(OPEN_REPO)}
          width="max-content"
        />
      </Row>
    </>
  ) : null;
}
