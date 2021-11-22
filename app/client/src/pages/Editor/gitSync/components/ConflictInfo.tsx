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
  PULL_CHANGES,
} from "constants/messages";
import { DOCS_BASE_URL } from "constants/ThirdPartyConstants";
import { Theme } from "constants/DefaultTheme";
import Button, { Category, Size } from "components/ads/Button";
import { useSelector } from "store";
import { getCurrentAppGitMetaData } from "selectors/applicationSelectors";
import { getIsPullingProgress } from "selectors/gitSyncSelectors";
import { gitPullInit } from "actions/gitSyncActions";
import { useDispatch } from "react-redux";
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
  const currentBranch = gitMetaData?.branchName;
  const isPullingProgress = useSelector(getIsPullingProgress);
  const dispatch = useDispatch();
  const handlePull = () => {
    if (currentBranch) {
      dispatch(gitPullInit());
    }
  };
  let remoteUrl = "";
  if (gitMetaData?.remoteUrl) {
    remoteUrl =
      gitMetaData?.remoteUrl?.indexOf("git@") > -1
        ? gitMetaData?.remoteUrl.replace(
            "git@github.com:",
            "https://github.com/",
          )
        : "";
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
          size={Size.medium}
          tag="a"
          target="_blank"
          text={createMessage(OPEN_REPO)}
          width="max-content"
        />
        <Button
          className="t--commit-button"
          isLoading={isPullingProgress}
          onClick={handlePull}
          size={Size.medium}
          tag="button"
          text={createMessage(PULL_CHANGES)}
          width="max-content"
        />
      </Row>
    </>
  ) : null;
}
