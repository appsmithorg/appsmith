import React, { useEffect, useState, useRef, useMemo } from "react";
import { Title } from "../components/StyledComponents";
import {
  DEPLOY_YOUR_APPLICATION,
  COMMIT_TO,
  COMMIT,
  // PUSH_CHANGES_IMMEDIATELY_TO,
  // PUSH_CHANGES,
  // PUSH_TO,
  createMessage,
  COMMIT_AND_PUSH,
  // COMMITTED_SUCCESSFULLY,
  // PUSHED_SUCCESSFULLY,
} from "constants/messages";
import styled from "styled-components";
import TextInput from "components/ads/TextInput";
import Button, { Size } from "components/ads/Button";
import { LabelContainer } from "components/ads/Checkbox";

// import { DEFAULT_REMOTE } from "../constants";

import {
  getGitStatus,
  getIsFetchingGitStatus,
  // getIsCommitSuccessful,
  getIsCommittingInProgress,
  // getIsPushingToGit,
  // getIsPushSuccessful,
} from "selectors/gitSyncSelectors";
import { useDispatch, useSelector } from "react-redux";
import { commitToRepoInit } from "actions/gitSyncActions";

import { Space } from "../components/StyledComponents";
import { Colors } from "constants/Colors";
import { getTypographyByKey } from "constants/DefaultTheme";

import { getCurrentAppGitMetaData } from "selectors/applicationSelectors";
// import { pushToRepoInit } from "actions/gitSyncActions";
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
  .see-more-text {
    font-size: 12px;
    cursor: pointer;
    color: ${Colors.GRAY};
  }
`;

const ErrorMsgWrapper = styled.div<{ $hide: boolean }>`
  margin-top: ${(props) => props.theme.spaces[8]}px;
  max-height: 160px;
  max-width: 96%;
  overflow-y: ${(props) => (props.$hide ? "hidden" : "scroll")};
  .git-error-text {
    height: 100%;
    margin: 0px;
    padding: 0px;
    font-size: 12px;
    white-space: pre-line;
    word-break: break-word;
  }
`;

function Deploy() {
  // const [pushImmediately, setPushImmediately] = useState(true);
  const [commitMessage, setCommitMessage] = useState("Initial Commit");
  const [showCompleteError, setShowCompleteError] = useState(false);
  const isCommittingInProgress = useSelector(getIsCommittingInProgress);
  // const isPushingToGit = useSelector(getIsPushingToGit);
  const gitMetaData = useSelector(getCurrentAppGitMetaData);
  const gitStatus = useSelector(getGitStatus);
  const isFetchingGitStatus = useSelector(getIsFetchingGitStatus);
  const gitPushError = useSelector(getGitPushError);
  const errorMsgRef = useRef<HTMLDivElement>(null);

  const hasChangesToCommit = !gitStatus?.isClean;
  // (gitStatus && gitStatus?.uncommitted?.length > 0) ||
  // (gitStatus && gitStatus?.untracked?.length > 0);

  // const hasCommitsToPush = gitStatus?.isClean;

  // const isCommitSuccessful = useSelector(getIsCommitSuccessful);
  // const isPushSuccessful = useSelector(getIsPushSuccessful);

  const currentBranch = gitMetaData?.branchName;
  const dispatch = useDispatch();

  const handleCommit = () => {
    if (currentBranch) {
      dispatch(
        commitToRepoInit({
          commitMessage,
          doPush: true,
          // pushImmediately
        }),
      );
    }
  };

  // const handlePushToGit = () => {
  //   dispatch(pushToRepoInit());
  // };

  let commitButtonText = "";

  // if (isCommitSuccessful) {
  // if (pushImmediately) {
  //   commitButtonText = createMessage(COMMITTED_SUCCESSFULLY);
  // } else {
  //   commitButtonText = createMessage(COMMITTED_SUCCESSFULLY);
  // }
  // } else {
  if (true) {
    commitButtonText = createMessage(COMMIT_AND_PUSH);
  } else {
    commitButtonText = createMessage(COMMIT);
  }
  // }

  // const pushButtonText = createMessage(PUSH_CHANGES);

  useEffect(() => {
    dispatch(fetchGitStatusInit());
  }, []);

  const commitButtonDisabled = !hasChangesToCommit || !commitMessage;
  const commitButtonLoading = isCommittingInProgress || isFetchingGitStatus;
  // const pushButtonDisabled = !hasCommitsToPush;
  const errorMsgShowMoreEnabled = useMemo(() => {
    let showMoreEnabled = false;
    if (errorMsgRef && errorMsgRef.current) {
      const element = errorMsgRef.current;
      if (element && element?.offsetHeight && element?.scrollHeight) {
        showMoreEnabled = element?.offsetHeight < element?.scrollHeight;
      }
    }
    return showMoreEnabled;
  }, [errorMsgRef.current, gitPushError]);

  return (
    <Container>
      <Title>{createMessage(DEPLOY_YOUR_APPLICATION)}</Title>
      <Section>
        <Row>
          <SectionTitle>
            <span>{createMessage(COMMIT_TO)}</span>
            <span className="branch">&nbsp;{currentBranch}</span>
          </SectionTitle>
        </Row>
        <Space size={3} />
        <TextInput
          autoFocus
          defaultValue={commitMessage}
          disabled={!hasChangesToCommit}
          fill
          onChange={setCommitMessage}
        />
        {/* <Space size={3} />
        <Checkbox
          disabled={hasCommitsToPush}
          isDefaultChecked
          label={`${createMessage(
            PUSH_CHANGES_IMMEDIATELY_TO,
          )} ${DEFAULT_REMOTE}/${currentBranch}`}
          onCheckChange={(checked: boolean) => setPushImmediately(checked)}
        /> */}
        <Space size={11} />
        <Button
          className="t--commit-button"
          disabled={commitButtonDisabled}
          isLoading={commitButtonLoading}
          onClick={handleCommit}
          size={Size.medium}
          tag="button"
          text={commitButtonText}
          width="max-content"
        />
      </Section>
      {/** TODO: handle error cases and create new branch for push */}
      {/* {!pushImmediately ? (
        <Section>
          <Space size={10} />
          <Row>
            <SectionTitle
              style={{
                marginRight: -1 * theme.spaces[2],
                top: -1,
                position: "relative",
              }}
            >
              {createMessage(PUSH_TO)}
              <span className="branch">&nbsp;{currentBranch}</span>
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
      ) : null} */}

      {!hasChangesToCommit && <DeployPreview />}
      {/* Disabled currently */}
      {gitPushError && false && (
        <ErrorContainer>
          <Text className="error-text" type={TextType.P1}>
            Error while pushing
          </Text>
          {/* Add Show More toggle */}
          <ErrorMsgWrapper $hide={!showCompleteError} ref={errorMsgRef}>
            <pre className="git-error-text error-text">{gitPushError}</pre>
          </ErrorMsgWrapper>
          {errorMsgShowMoreEnabled && (
            <span
              className="see-more-text"
              onClick={() => setShowCompleteError(!showCompleteError)}
            >
              {showCompleteError ? "SEE LESS" : "SEE MORE"}
            </span>
          )}
        </ErrorContainer>
      )}
    </Container>
  );
}

export default Deploy;
