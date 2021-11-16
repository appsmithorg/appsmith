import React, { useEffect, useState } from "react";
import { Title } from "../components/StyledComponents";
import {
  DEPLOY_YOUR_APPLICATION,
  COMMIT_TO,
  createMessage,
  COMMIT_AND_PUSH,
  COMMITTING_AND_PUSHING_CHANGES,
  FETCH_GIT_STATUS,
  GIT_NO_UPDATED_TOOLTIP,
  GIT_UPSTREAM_CHANGES,
  LEARN_MORE,
  PULL_CHANGS,
  GIT_CONFLICTING_INFO,
  OPEN_REPO,
} from "constants/messages";
import styled from "styled-components";
import TextInput from "components/ads/TextInput";
import Button, { Category, Size } from "components/ads/Button";
import { LabelContainer } from "components/ads/Checkbox";

import {
  getGitStatus,
  getIsFetchingGitStatus,
  getIsCommittingInProgress,
  getIsPullingProgress,
  getGitError,
  getPullMergeStatus,
} from "selectors/gitSyncSelectors";
import { useDispatch, useSelector } from "react-redux";

import { Space } from "../components/StyledComponents";
import { Colors } from "constants/Colors";
import { getTypographyByKey } from "constants/DefaultTheme";

import { getCurrentAppGitMetaData } from "selectors/applicationSelectors";
import DeployPreview from "../components/DeployPreview";
import {
  commitToRepoInit,
  fetchGitStatusInit,
  gitPullInit,
} from "actions/gitSyncActions";
import { getIsCommitSuccessful } from "selectors/gitSyncSelectors";
import StatusLoader from "../components/StatusLoader";
import { clearCommitSuccessfulState } from "../../../../actions/gitSyncActions";
import Statusbar from "pages/Editor/gitSync/components/Statusbar";
import GitSyncError from "../components/GitSyncError";
import GitChanged from "../components/GitChanged";
import Tooltip from "components/ads/Tooltip";
import Text, { Case, FontWeight, TextType } from "components/ads/Text";
import { DOCS_BASE_URL } from "constants/ThirdPartyConstants";
import Icon, { IconSize } from "components/ads/Icon";
import { Classes } from "components/ads/common";
import log from "loglevel";

const Section = styled.div`
  margin-bottom: ${(props) => props.theme.spaces[11]}px;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
`;

const SectionTitle = styled.div`
  ${(props) => getTypographyByKey(props, "p1")};
  color: ${Colors.CHARCOAL};
  & .branch {
    color: ${Colors.CRUSTA};
  }
`;

const Container = styled.div`
  width: 100%;
  && ${LabelContainer} span {
    color: ${Colors.CHARCOAL};
  }
  .bp3-popover-target {
    width: fit-content;
  }
`;

const StatusbarWrapper = styled.div`
  width: 252px;
  height: 38px;
`;

const LintText = styled.a`
  :hover {
    text-decoration: none;
    color: ${Colors.CRUSTA};
  }
  color: ${Colors.CRUSTA};
  cursor: pointer;
`;

const InfoWrapper = styled.div<{ isError?: boolean }>`
  width: 100%;
  padding: ${(props) => props.theme.spaces[3]}px;
  background: ${(props) =>
    props.isError ? Colors.FAIR_PINK : Colors.WARNING_OUTLINE_HOVER};
  margin-bottom: ${(props) => props.theme.spaces[4]}px;
  .${Classes.TEXT} {
    &.t--read-document {
      margin-left: ${(props) => props.theme.spaces[2]}px;
      display: inline-flex;
      .${Classes.ICON} {
        margin-left: ${(props) => props.theme.spaces[3]}px;
      }
    }
  }
`;

const OpenRepoButton = styled(Button)`
  margin-right: ${(props) => props.theme.spaces[3]}px;
`;

const INITIAL_COMMIT = "Initial Commit";
const NO_CHANGES_TO_COMMIT = "No changes to commit";

function Deploy() {
  const [commitMessage, setCommitMessage] = useState(INITIAL_COMMIT);
  const isCommittingInProgress = useSelector(getIsCommittingInProgress);
  const gitMetaData = useSelector(getCurrentAppGitMetaData);
  const gitStatus = useSelector(getGitStatus);
  const isFetchingGitStatus = useSelector(getIsFetchingGitStatus);
  const isPulingProgress = useSelector(getIsPullingProgress);
  const isCommitAndPushSuccessful = useSelector(getIsCommitSuccessful);
  const hasChangesToCommit = !gitStatus?.isClean;
  const gitError = useSelector(getGitError);
  const pullMergeStatus = useSelector(getPullMergeStatus);

  const currentBranch = gitMetaData?.branchName;
  const dispatch = useDispatch();

  const handleCommit = (doPush: boolean) => {
    if (currentBranch) {
      dispatch(
        commitToRepoInit({
          commitMessage,
          doPush,
        }),
      );
    }
  };

  const handlePull = () => {
    if (currentBranch) {
      dispatch(gitPullInit());
    }
  };

  const commitButtonText = createMessage(COMMIT_AND_PUSH);

  useEffect(() => {
    dispatch(fetchGitStatusInit());
    return () => {
      dispatch(clearCommitSuccessfulState());
    };
  }, []);
  const commitButtonDisabled = !hasChangesToCommit || !commitMessage;
  const commitButtonLoading = isCommittingInProgress;

  const commitRequired = gitStatus?.modifiedPages || gitStatus?.modifiedQueries;
  const isConflicting =
    !isFetchingGitStatus &&
    pullMergeStatus &&
    pullMergeStatus?.conflictingFiles?.length > 0;
  // const pullRequired =
  //   gitStatus && gitStatus.behindCount > 0 && !isFetchingGitStatus;
  let pullRequired = false;
  if (!isFetchingGitStatus && gitError && gitError.code === 5006) {
    pullRequired = gitError.message.indexOf("git  push failed") > -1;
  }
  const showCommitButton =
    // hasChangesToCommit &&
    !isConflicting &&
    !pullRequired &&
    !isFetchingGitStatus &&
    !isCommittingInProgress;
  const isProgressing =
    commitButtonLoading && (commitRequired || showCommitButton);
  const commitMessageDisplay = hasChangesToCommit
    ? commitMessage
    : NO_CHANGES_TO_COMMIT;
  log.log(gitStatus);
  log.log(gitError);
  return (
    <Container>
      <Title>{createMessage(DEPLOY_YOUR_APPLICATION)}</Title>
      <Section>
        <GitChanged />
        <Row>
          <SectionTitle>
            <span>{createMessage(COMMIT_TO)}</span>
            <span className="branch">&nbsp;{currentBranch}</span>
          </SectionTitle>
        </Row>
        <Space size={3} />
        <TextInput
          autoFocus
          disabled={!hasChangesToCommit || isFetchingGitStatus}
          fill
          onChange={setCommitMessage}
          trimValue={false}
          value={commitMessageDisplay}
        />
        {isFetchingGitStatus && (
          <StatusLoader loaderMsg={createMessage(FETCH_GIT_STATUS)} />
        )}
        <Space size={11} />
        {pullRequired && !isConflicting && (
          <InfoWrapper>
            <Text type={TextType.P3}>
              {createMessage(GIT_UPSTREAM_CHANGES)}
            </Text>
            <LintText href={DOCS_BASE_URL} target="_blank">
              <Text
                case={Case.UPPERCASE}
                className="t--read-document"
                color={Colors.CHARCOAL}
                type={TextType.P3}
                weight={FontWeight.BOLD}
              >
                {createMessage(LEARN_MORE)}
                <Icon name="right-arrow" size={IconSize.SMALL} />
              </Text>
            </LintText>
          </InfoWrapper>
        )}
        {pullRequired && !isConflicting && (
          <Button
            className="t--commit-button"
            isLoading={isPulingProgress}
            onClick={handlePull}
            size={Size.medium}
            tag="button"
            text={createMessage(PULL_CHANGS)}
            width="max-content"
          />
        )}
        {isConflicting && (
          <InfoWrapper isError>
            <Text type={TextType.P3}>
              {createMessage(GIT_CONFLICTING_INFO)}
            </Text>
            <LintText href={DOCS_BASE_URL} target="_blank">
              <Text
                case={Case.UPPERCASE}
                className="t--read-document"
                color={Colors.CHARCOAL}
                type={TextType.P3}
                weight={FontWeight.BOLD}
              >
                {createMessage(LEARN_MORE)}
                <Icon name="right-arrow" size={IconSize.SMALL} />
              </Text>
            </LintText>
          </InfoWrapper>
        )}
        {isConflicting && (
          <Row>
            <OpenRepoButton
              category={Category.tertiary}
              className="t--commit-button"
              href={gitMetaData?.remoteUrl}
              isLoading={isPulingProgress}
              size={Size.medium}
              tag="a"
              target="_blank"
              text={createMessage(OPEN_REPO)}
              width="max-content"
            />
            <Button
              className="t--commit-button"
              isLoading={isPulingProgress}
              onClick={handlePull}
              size={Size.medium}
              tag="button"
              text={createMessage(PULL_CHANGS)}
              width="max-content"
            />
          </Row>
        )}
        {showCommitButton && (
          <Tooltip
            autoFocus={false}
            content={createMessage(GIT_NO_UPDATED_TOOLTIP)}
            disabled={showCommitButton && !commitButtonLoading}
            donotUsePortal
            position="top"
          >
            <Button
              className="t--commit-button"
              disabled={commitButtonDisabled}
              isLoading={commitButtonLoading}
              onClick={() => handleCommit(true)}
              size={Size.medium}
              tag="button"
              text={commitButtonText}
              width="max-content"
            />
          </Tooltip>
        )}
        {isProgressing && (
          <StatusbarWrapper>
            <Statusbar
              completed={!commitButtonLoading}
              message={createMessage(COMMITTING_AND_PUSHING_CHANGES)}
              period={2}
            />
          </StatusbarWrapper>
        )}
        <GitSyncError />
      </Section>
      {!pullRequired && !isConflicting && (
        <DeployPreview showSuccess={isCommitAndPushSuccessful} />
      )}
    </Container>
  );
}

export default Deploy;
