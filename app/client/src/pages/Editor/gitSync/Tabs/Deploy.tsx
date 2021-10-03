import React, { useEffect, useState, useRef } from "react";
import { Title } from "../components/StyledComponents";
import {
  DEPLOY_YOUR_APPLICATION,
  COMMIT_TO,
  COMMIT,
  PUSH_CHANGES_IMMEDIATELY_TO,
  PUSH_CHANGES,
  PUSH_TO,
  createMessage,
  COMMIT_AND_PUSH,
  // COMMITTED_SUCCESSFULLY,
  // PUSHED_SUCCESSFULLY,
} from "constants/messages";
import styled from "styled-components";
import TextInput from "components/ads/TextInput";
import Button, { Category, Size } from "components/ads/Button";
import Checkbox, { LabelContainer } from "components/ads/Checkbox";

import { DEFAULT_REMOTE } from "../constants";

import {
  getGitStatus,
  // getIsCommitSuccessful,
  getIsCommittingInProgress,
  getIsPushingToGit,
  // getIsPushSuccessful,
} from "selectors/gitSyncSelectors";
import { useDispatch, useSelector } from "react-redux";
import { commitToRepoInit } from "actions/gitSyncActions";

import { Space } from "../components/StyledComponents";
import { Colors } from "constants/Colors";
import { getTypographyByKey, Theme } from "constants/DefaultTheme";

import { withTheme } from "styled-components";
import { getCurrentAppGitMetaData } from "selectors/applicationSelectors";
import { pushToRepoInit } from "actions/gitSyncActions";
import DeployPreview from "../components/DeployPreview";
import { fetchGitStatusInit } from "actions/gitSyncActions";
import { getGitPushError } from "selectors/gitSyncSelectors";
import Text, { TextType } from "components/ads/Text";

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
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  .error-text {
    color: ${Colors.POMEGRANATE2};
  }
`;

const ErrorMsgWrapper = styled.div<{ $show: boolean }>`
  max-height: 160px;
  max-width: 96%;
  overflow-y: ${(props) => (props.$show ? "hidden" : "scroll")};
  .git-error-text {
    margin: 0px;
    padding: 0px;
    font-size: 12px;
    white-space: pre-line;
    word-break: break-word;
  }
`;

function Deploy({ theme }: { theme: Theme }) {
  const [pushImmediately, setPushImmediately] = useState(true);
  const [commitMessage, setCommitMessage] = useState("Initial Commit");
  const isCommittingInProgress = useSelector(getIsCommittingInProgress);
  const isPushingToGit = useSelector(getIsPushingToGit);
  const gitMetaData = useSelector(getCurrentAppGitMetaData);
  const gitStatus = useSelector(getGitStatus);
  const gitPushError = useSelector(getGitPushError);
  const errorMsgRef = useRef<HTMLDivElement>(null);

  const hasChangesToCommit =
    (gitStatus && gitStatus?.uncommitted?.length > 0) ||
    (gitStatus && gitStatus?.untracked?.length > 0);

  const hasCommitsToPush = gitStatus?.isClean;

  // const isCommitSuccessful = useSelector(getIsCommitSuccessful);
  // const isPushSuccessful = useSelector(getIsPushSuccessful);

  const currentBranchName = gitMetaData?.branchName;

  const dispatch = useDispatch();

  const handleCommit = () => {
    if (currentBranchName) {
      dispatch(
        commitToRepoInit({
          commitMessage,
          doPush: pushImmediately,
        }),
      );
    }
  };

  const handlePushToGit = () => {
    dispatch(pushToRepoInit());
  };

  let commitButtonText = "";

  // if (isCommitSuccessful) {
  // if (pushImmediately) {
  //   commitButtonText = createMessage(COMMITTED_SUCCESSFULLY);
  // } else {
  //   commitButtonText = createMessage(COMMITTED_SUCCESSFULLY);
  // }
  // } else {
  if (pushImmediately) {
    commitButtonText = createMessage(COMMIT_AND_PUSH);
  } else {
    commitButtonText = createMessage(COMMIT);
  }
  // }

  const pushButtonText =
    // isPushSuccessful
    //   ? createMessage(PUSHED_SUCCESSFULLY) :
    createMessage(PUSH_CHANGES);

  useEffect(() => {
    dispatch(fetchGitStatusInit());
  }, []);

  const commitButtonDisabled = !hasChangesToCommit || !commitMessage;
  const pushButtonDisabled = !hasCommitsToPush;

  let errorMsgShowMoreEnabled = false;
  if (errorMsgRef && errorMsgRef.current) {
    const element = errorMsgRef.current;
    if (element && element?.offsetHeight && element?.scrollHeight) {
      errorMsgShowMoreEnabled = element?.offsetHeight < element?.scrollHeight;
    }
  }

  return (
    <Container>
      <Title>{createMessage(DEPLOY_YOUR_APPLICATION)}</Title>
      <Section>
        <Row>
          <SectionTitle>
            <span>{createMessage(COMMIT_TO)}</span>
            <span className="branch">&nbsp;{currentBranchName}</span>
          </SectionTitle>
        </Row>
        <Space size={3} />
        <TextInput
          autoFocus
          defaultValue={commitMessage}
          disabled={hasCommitsToPush}
          fill
          onChange={setCommitMessage}
        />
        <Space size={3} />
        <Checkbox
          disabled={hasCommitsToPush}
          isDefaultChecked
          label={`${createMessage(
            PUSH_CHANGES_IMMEDIATELY_TO,
          )} ${DEFAULT_REMOTE}/${currentBranchName}`}
          onCheckChange={(checked: boolean) => setPushImmediately(checked)}
        />
        <Space size={11} />
        <Button
          disabled={commitButtonDisabled}
          isLoading={isCommittingInProgress}
          onClick={handleCommit}
          size={Size.medium}
          tag="button"
          text={commitButtonText}
          width="max-content"
        />
      </Section>
      {/** TODO: handle error cases and create new branch for push */}
      {!pushImmediately ? (
        <Section>
          <Space size={10} />
          <Row>
            {/** TODO: refactor dropdown component to avoid negative margins */}
            <SectionTitle
              style={{
                marginRight: -1 * theme.spaces[2],
                top: -1,
                position: "relative",
              }}
            >
              {createMessage(PUSH_TO)}
              <span className="branch">&nbsp;{currentBranchName}</span>
            </SectionTitle>
          </Row>
          <Space size={3} />
          <Button
            category={Category.tertiary}
            disabled={pushButtonDisabled}
            isLoading={isPushingToGit}
            onClick={handlePushToGit}
            size={Size.medium}
            tag="button"
            text={pushButtonText}
            width="max-content"
          />
        </Section>
      ) : null}

      {!hasChangesToCommit && !hasCommitsToPush && !gitPushError && (
        <DeployPreview />
      )}
      {gitPushError && (
        <ErrorContainer>
          <Text className="error-text" type={TextType.P1}>
            Error while pushing
          </Text>
          {/* Add Show More toggle */}
          <ErrorMsgWrapper $show={errorMsgShowMoreEnabled} ref={errorMsgRef}>
            <pre className="git-error-text error-text">{gitPushError}</pre>
          </ErrorMsgWrapper>
          {errorMsgShowMoreEnabled ? "Show More" : "Nothing much"}
        </ErrorContainer>
      )}
    </Container>
  );
}

export default withTheme(Deploy);
