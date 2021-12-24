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
} from "constants/messages";
import { DOCS_BASE_URL } from "constants/ThirdPartyConstants";
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
};

export default function ConflictInfo(props: CIPropType) {
  const { isConflicting } = props;
  const theme = useTheme() as Theme;
  const gitMetaData = useSelector(getCurrentAppGitMetaData);
  const originUrl = gitMetaData?.remoteUrl;

  /**
   * Converting ssh url to https url for opening the repo on browser
   * Github :
   *    SSH: git@github.com:user/repo.git
   *    HTTPS: https://github.com/user/repo.git
   * Gitlab:
   *    SSH: git@gitlab.com:abhijeet25/first_project.git
   *    HTTPS: https://gitlab.com/abhijeet25/first_project.git
   * Bitbucket
   *    SSH: git@bitbucket.org:abhvsn/onec2_firstapp.git
   *    HTTPS: https://abhvsn@bitbucket.org/abhvsn/onec2_firstapp.git
   */
  let remoteUrl = originUrl;
  if (originUrl && new RegExp("git@*").test(originUrl)) {
    remoteUrl = remoteUrl?.replace(":", "/");
    remoteUrl = remoteUrl?.replace(/git@/, "https://");
    // bitbucket repo
    if (new RegExp("bitbucket.org").test(originUrl)) {
      const match = remoteUrl?.match(/\/\w+/g);
      if (match && match.length > 2) {
        remoteUrl = remoteUrl?.replace(
          /bitbucket.org/,
          match[1].substr(1) + "@bitbucket.org",
        );
      }
    }
  }
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
            link={DOCS_BASE_URL}
            text={createMessage(LEARN_MORE)}
          />
        </div>
      </InfoWrapper>
      <Row>
        <OpenRepoButton
          category={Category.tertiary}
          className="t--commit-button"
          href={remoteUrl}
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
