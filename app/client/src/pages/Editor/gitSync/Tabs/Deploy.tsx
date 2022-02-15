import React, { useEffect, useRef, useState } from "react";
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
  PULL_CHANGES,
  READ_DOCUMENTATION,
} from "@appsmith/constants/messages";
import styled, { useTheme } from "styled-components";
import TextInput from "components/ads/TextInput";
import Button, { Size } from "components/ads/Button";
import { LabelContainer } from "components/ads/Checkbox";

import {
  getGitStatus,
  getIsFetchingGitStatus,
  getIsCommittingInProgress,
  getIsPullingProgress,
  getPullFailed,
  getGitCommitAndPushError,
  getUpstreamErrorDocUrl,
  getConflictFoundDocUrlDeploy,
} from "selectors/gitSyncSelectors";
import { useDispatch, useSelector } from "react-redux";

import { Space } from "../components/StyledComponents";
import { Colors } from "constants/Colors";
import { getTypographyByKey, Theme } from "constants/DefaultTheme";

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
import Statusbar, {
  StatusbarWrapper,
} from "pages/Editor/gitSync/components/Statusbar";
import GitChanged from "../components/GitChanged";
import Tooltip from "components/ads/Tooltip";
import Text, { TextType } from "components/ads/Text";
import InfoWrapper from "../components/InfoWrapper";
import Link from "../components/Link";
import ConflictInfo from "../components/ConflictInfo";
import Icon, { IconSize } from "components/ads/Icon";

import { isMac } from "utils/helpers";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getApplicationLastDeployedAt } from "selectors/editorSelectors";
import GIT_ERROR_CODES from "constants/GitErrorCodes";
import useAutoGrow from "utils/hooks/useAutoGrow";

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
  display: inline-flex;
  & .branch {
    color: ${Colors.CRUSTA};
    width: 240px;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
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

const INITIAL_COMMIT = "Initial Commit";
const NO_CHANGES_TO_COMMIT = "No changes to commit";

function SubmitWrapper(props: {
  children: React.ReactNode;
  onSubmit: () => void;
}) {
  const onKeyDown = (e: React.KeyboardEvent) => {
    const triggerSubmit = isMac()
      ? e.metaKey && e.key === "Enter"
      : e.ctrlKey && e.key === "Enter";
    if (triggerSubmit) props.onSubmit();
  };

  return <div onKeyDown={onKeyDown}>{props.children}</div>;
}

function Deploy() {
  const lastDeployedAt = useSelector(getApplicationLastDeployedAt);
  const isCommittingInProgress = useSelector(getIsCommittingInProgress);
  const gitMetaData = useSelector(getCurrentAppGitMetaData);
  const gitStatus = useSelector(getGitStatus);
  const isFetchingGitStatus = useSelector(getIsFetchingGitStatus);
  const isPullingProgress = useSelector(getIsPullingProgress);
  const isCommitAndPushSuccessful = useSelector(getIsCommitSuccessful);
  const hasChangesToCommit = !gitStatus?.isClean;
  const gitError = useSelector(getGitCommitAndPushError);
  const pullFailed = useSelector(getPullFailed);
  const commitInputRef = useRef<HTMLInputElement>(null);
  const upstreamErrorDocumentUrl = useSelector(getUpstreamErrorDocUrl);
  const [commitMessage, setCommitMessage] = useState(
    gitMetaData?.remoteUrl && lastDeployedAt ? "" : INITIAL_COMMIT,
  );

  const currentBranch = gitMetaData?.branchName;
  const dispatch = useDispatch();

  const handleCommit = (doPush: boolean) => {
    AnalyticsUtil.logEvent("GS_COMMIT_AND_PUSH_BUTTON_CLICK", {
      source: "GIT_DEPLOY_MODAL",
    });
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
    AnalyticsUtil.logEvent("GS_PULL_GIT_CLICK", {
      source: "GIT_DEPLOY_MODAL",
    });
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
  const commitInputDisabled = !hasChangesToCommit || isCommittingInProgress;

  const commitRequired = gitStatus?.modifiedPages || gitStatus?.modifiedQueries;
  const isConflicting = !isFetchingGitStatus && pullFailed;

  const pullRequired =
    gitError &&
    gitError.code === GIT_ERROR_CODES.PUSH_FAILED_REMOTE_COUNTERPART_IS_AHEAD;
  const showCommitButton =
    !isConflicting &&
    !pullRequired &&
    !isFetchingGitStatus &&
    !isCommittingInProgress;
  const isProgressing =
    commitButtonLoading && (commitRequired || showCommitButton);
  const commitMessageDisplay = hasChangesToCommit
    ? commitMessage
    : NO_CHANGES_TO_COMMIT;

  const theme = useTheme() as Theme;

  useEffect(() => {
    if (!commitInputDisabled && commitInputRef.current) {
      commitInputRef.current.focus();
    }
  }, [commitInputDisabled]);

  const gitConflictDocumentUrl = useSelector(getConflictFoundDocUrlDeploy);

  const autogrowHeight = useAutoGrow(commitMessageDisplay, 37);

  return (
    <Container>
      <Title>{createMessage(DEPLOY_YOUR_APPLICATION)}</Title>
      <Section>
        <GitChanged />
        <Row>
          <SectionTitle>
            <span>{createMessage(COMMIT_TO)}</span>
            <div className="branch">&nbsp;{currentBranch}</div>
          </SectionTitle>
        </Row>
        <Space size={3} />
        <SubmitWrapper
          onSubmit={() => {
            if (!commitButtonDisabled) handleCommit(true);
          }}
        >
          <TextInput
            $padding="8px 14px"
            autoFocus
            disabled={commitInputDisabled}
            fill
            height={`${Math.min(autogrowHeight, 80)}px`}
            onChange={setCommitMessage}
            ref={commitInputRef}
            trimValue={false}
            useTextArea
            value={commitMessageDisplay}
          />
        </SubmitWrapper>
        {isFetchingGitStatus && (
          <StatusLoader loaderMsg={createMessage(FETCH_GIT_STATUS)} />
        )}
        <Space size={11} />
        {pullRequired && !isConflicting && (
          <InfoWrapper>
            <Icon
              fillColor={Colors.YELLOW_LIGHT}
              name="info"
              size={IconSize.XXXL}
            />
            <div style={{ display: "block" }}>
              <Text style={{ marginRight: theme.spaces[2] }} type={TextType.P3}>
                {createMessage(GIT_UPSTREAM_CHANGES)}
              </Text>
              <Link
                link={upstreamErrorDocumentUrl}
                onClick={() => {
                  AnalyticsUtil.logEvent("GS_GIT_DOCUMENTATION_LINK_CLICK", {
                    source: "UPSTREAM_CHANGES_LINK_ON_GIT_DEPLOY_MODAL",
                  });
                  window.open(upstreamErrorDocumentUrl, "_blank");
                }}
                text={createMessage(READ_DOCUMENTATION)}
              />
            </div>
          </InfoWrapper>
        )}
        {pullRequired && !isConflicting && (
          <Button
            className="t--commit-button"
            isLoading={isPullingProgress}
            onClick={handlePull}
            size={Size.large}
            tag="button"
            text={createMessage(PULL_CHANGES)}
            width="max-content"
          />
        )}
        <ConflictInfo
          isConflicting={isConflicting}
          learnMoreLink={gitConflictDocumentUrl}
        />
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
              size={Size.large}
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
      </Section>
      {!pullRequired && !isConflicting && (
        <DeployPreview showSuccess={isCommitAndPushSuccessful} />
      )}
    </Container>
  );
}

export default Deploy;
