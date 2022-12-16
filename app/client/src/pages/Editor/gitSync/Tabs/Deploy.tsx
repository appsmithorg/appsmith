import React, { useEffect, useRef, useState } from "react";
import {
  ARE_YOU_SURE,
  COMMIT_AND_PUSH,
  COMMIT_TO,
  COMMITTING_AND_PUSHING_CHANGES,
  createMessage,
  DEPLOY_YOUR_APPLICATION,
  DISCARD_CHANGES,
  DISCARDING_AND_PULLING_CHANGES,
  FETCH_GIT_STATUS,
  GIT_NO_UPDATED_TOOLTIP,
  GIT_UPSTREAM_CHANGES,
  PULL_CHANGES,
  READ_DOCUMENTATION,
} from "@appsmith/constants/messages";
import styled, { useTheme } from "styled-components";
import {
  Button,
  Category,
  getTypographyByKey,
  Icon,
  IconSize,
  LabelContainer,
  ScrollIndicator,
  Size,
  Text,
  TextInput,
  TextType,
  TooltipComponent as Tooltip,
  Variant,
} from "design-system";
import {
  getConflictFoundDocUrlDeploy,
  getDiscardDocUrl,
  getGitCommitAndPushError,
  getGitStatus,
  getIsCommitSuccessful,
  getIsCommittingInProgress,
  getIsDiscardInProgress,
  getIsFetchingGitStatus,
  getIsPullingProgress,
  getPullFailed,
  getUpstreamErrorDocUrl,
} from "selectors/gitSyncSelectors";
import { useDispatch, useSelector } from "react-redux";
import { Colors } from "constants/Colors";
import { Theme } from "constants/DefaultTheme";

import { getCurrentAppGitMetaData } from "selectors/applicationSelectors";
import DeployPreview from "../components/DeployPreview";
import {
  clearCommitErrorState,
  clearCommitSuccessfulState,
  commitToRepoInit,
  discardChanges,
  fetchGitStatusInit,
  gitPullInit,
} from "actions/gitSyncActions";
import StatusLoader from "../components/StatusLoader";
import Statusbar, {
  StatusbarWrapper,
} from "pages/Editor/gitSync/components/Statusbar";
import GitChangesList from "../components/GitChangesList";
import InfoWrapper from "../components/InfoWrapper";
import Link from "../components/Link";
import ConflictInfo from "../components/ConflictInfo";

import { isMacOrIOS } from "utils/helpers";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  getApplicationLastDeployedAt,
  getCurrentApplication,
} from "selectors/editorSelectors";
import GIT_ERROR_CODES from "constants/GitErrorCodes";
import useAutoGrow from "utils/hooks/useAutoGrow";
import { Space, Title } from "../components/StyledComponents";
import DiscardChangesWarning from "../components/DiscardChangesWarning";
import { changeInfoSinceLastCommit } from "../utils";
import { GitStatusData } from "reducers/uiReducers/gitSyncReducer";
import PushFailedWarning from "../components/PushFailedWarning";

const Section = styled.div`
  margin-top: 0;
  margin-bottom: ${(props) => props.theme.spaces[11]}px;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
`;

const SectionTitle = styled.div`
  ${getTypographyByKey("p1")};
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
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;

  &::-webkit-scrollbar-thumb {
    background-color: transparent;
  }

  &::-webkit-scrollbar {
    width: 0;
  }

  && ${LabelContainer} span {
    color: ${Colors.CHARCOAL};
  }

  .bp3-popover-target {
    width: fit-content;
  }
`;

const FIRST_COMMIT = "First Commit";
const NO_CHANGES_TO_COMMIT = "No changes to commit";

function SubmitWrapper(props: {
  children: React.ReactNode;
  onSubmit: () => void;
}) {
  const onKeyDown = (e: React.KeyboardEvent) => {
    const triggerSubmit = isMacOrIOS()
      ? e.metaKey && e.key === "Enter"
      : e.ctrlKey && e.key === "Enter";
    if (triggerSubmit) props.onSubmit();
  };

  return <div onKeyDown={onKeyDown}>{props.children}</div>;
}

const ActionsContainer = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  gap: ${(props) => props.theme.spaces[7]}px;

  & a.discard-changes-link {
  }
`;

function Deploy() {
  const lastDeployedAt = useSelector(getApplicationLastDeployedAt);
  const isCommittingInProgress = useSelector(getIsCommittingInProgress);
  const isDiscardInProgress = useSelector(getIsDiscardInProgress) || false;
  const gitMetaData = useSelector(getCurrentAppGitMetaData);
  const gitStatus = useSelector(getGitStatus) as GitStatusData;
  const isFetchingGitStatus = useSelector(getIsFetchingGitStatus);
  const isPullingProgress = useSelector(getIsPullingProgress);
  const isCommitAndPushSuccessful = useSelector(getIsCommitSuccessful);
  const hasChangesToCommit = !gitStatus?.isClean;
  const commitAndPushError = useSelector(getGitCommitAndPushError);
  const pullFailed = useSelector(getPullFailed);
  const commitInputRef = useRef<HTMLInputElement>(null);
  const upstreamErrorDocumentUrl = useSelector(getUpstreamErrorDocUrl);
  const discardDocUrl = useSelector(getDiscardDocUrl);
  const [commitMessage, setCommitMessage] = useState(
    gitMetaData?.remoteUrl && lastDeployedAt ? "" : FIRST_COMMIT,
  );
  const [shouldDiscard, setShouldDiscard] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(isDiscardInProgress);
  const [showDiscardWarning, setShowDiscardWarning] = useState(false);

  const currentBranch = gitMetaData?.branchName;
  const dispatch = useDispatch();

  const currentApplication = useSelector(getCurrentApplication);
  const {
    changeReasonText,
    isAutoUpdate,
    isManualUpdate,
  } = changeInfoSinceLastCommit(currentApplication);

  const handleCommit = (doPush: boolean) => {
    setShowDiscardWarning(false);
    AnalyticsUtil.logEvent("GS_COMMIT_AND_PUSH_BUTTON_CLICK", {
      source: "GIT_DEPLOY_MODAL",
      isAutoUpdate,
      isManualUpdate,
    });
    if (currentBranch) {
      dispatch(
        commitToRepoInit({
          commitMessage: commitMessage.trim(),
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
  const commitButtonDisabled =
    !hasChangesToCommit || !commitMessage || commitMessage.trim().length < 1;
  const commitButtonLoading = isCommittingInProgress;

  const commitRequired =
    !!gitStatus?.modifiedPages ||
    !!gitStatus?.modifiedQueries ||
    !!gitStatus?.modifiedJSObjects ||
    !!gitStatus?.modifiedDatasources;
  const isConflicting = !isFetchingGitStatus && !!pullFailed;
  const commitInputDisabled =
    isConflicting ||
    !hasChangesToCommit ||
    isCommittingInProgress ||
    isCommitAndPushSuccessful ||
    isDiscarding;
  const pullRequired =
    commitAndPushError?.code ===
    GIT_ERROR_CODES.PUSH_FAILED_REMOTE_COUNTERPART_IS_AHEAD;

  const showCommitButton =
    !isConflicting &&
    !pullRequired &&
    !isFetchingGitStatus &&
    !isCommittingInProgress &&
    !isDiscarding;
  const isCommitting =
    !!commitButtonLoading &&
    (commitRequired || showCommitButton) &&
    !isDiscarding;
  const showDiscardChangesButton =
    !isFetchingGitStatus &&
    !isCommittingInProgress &&
    hasChangesToCommit &&
    !isDiscarding &&
    !isCommitting;
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

  const onDiscardInit = () => {
    AnalyticsUtil.logEvent("GIT_DISCARD_WARNING", {
      source: "GIT_DISCARD_BUTTON_PRESS_1",
    });
    setShowDiscardWarning(true);
    setShouldDiscard(true);
  };
  const onDiscardChanges = () => {
    AnalyticsUtil.logEvent("GIT_DISCARD", {
      source: "GIT_DISCARD_BUTTON_PRESS_2",
    });
    dispatch(discardChanges());
    setShowDiscardWarning(false);
    setShouldDiscard(true);
    setIsDiscarding(true);
  };
  const onCloseDiscardWarning = () => {
    AnalyticsUtil.logEvent("GIT_DISCARD_CANCEL", {
      source: "GIT_DISCARD_WARNING_BANNER_CLOSE_CLICK",
    });
    setShowDiscardWarning(false);
    setShouldDiscard(false);
  };

  const scrollWrapperRef = React.createRef<HTMLDivElement>();
  useEffect(() => {
    if (scrollWrapperRef.current) {
      setTimeout(() => {
        const top = scrollWrapperRef.current?.scrollHeight || 0;
        scrollWrapperRef.current?.scrollTo({
          top: top,
        });
      }, 100);
    }
  }, [scrollWrapperRef]);

  const showPullButton =
    !isFetchingGitStatus &&
    ((pullRequired && !isConflicting) ||
      (gitStatus?.behindCount > 0 && gitStatus?.isClean));

  function handleCommitAndPushErrorClose() {
    dispatch(clearCommitErrorState());
  }

  return (
    <Container data-testid={"t--deploy-tab-container"} ref={scrollWrapperRef}>
      <Title>{createMessage(DEPLOY_YOUR_APPLICATION)}</Title>
      <Section>
        {hasChangesToCommit && (
          <Text
            data-testid={"t--git-deploy-change-reason-text"}
            type={TextType.P1}
          >
            {changeReasonText}
          </Text>
        )}
        <GitChangesList />
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
            className="t--commit-comment-input"
            disabled={commitInputDisabled}
            fill
            height={`${Math.min(autogrowHeight, 80)}px`}
            onChange={setCommitMessage}
            placeholder={"Your commit message here"}
            ref={commitInputRef}
            style={{ resize: "none" }}
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
        <ActionsContainer>
          {showPullButton && (
            <Button
              className="t--pull-button"
              isLoading={isPullingProgress}
              onClick={handlePull}
              size={Size.large}
              tag="button"
              text={createMessage(PULL_CHANGES)}
              width="max-content"
            />
          )}

          {showCommitButton && (
            <Tooltip
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
          {showDiscardChangesButton && (
            <Button
              category={Category.secondary}
              className="t--discard-button discard-changes-link"
              disabled={!showDiscardChangesButton}
              isLoading={
                isPullingProgress ||
                isFetchingGitStatus ||
                isCommittingInProgress
              }
              onClick={() =>
                shouldDiscard ? onDiscardChanges() : onDiscardInit()
              }
              size={Size.large}
              text={
                showDiscardWarning
                  ? createMessage(ARE_YOU_SURE)
                  : createMessage(DISCARD_CHANGES)
              }
              variant={Variant.danger}
            />
          )}
        </ActionsContainer>
        {isConflicting && (
          <ConflictInfo
            browserSupportedRemoteUrl={
              gitMetaData?.browserSupportedRemoteUrl || ""
            }
            learnMoreLink={gitConflictDocumentUrl}
          />
        )}
        {commitAndPushError && (
          <PushFailedWarning
            closeHandler={handleCommitAndPushErrorClose}
            error={commitAndPushError}
          />
        )}

        {isCommitting && !isDiscarding && (
          <StatusbarWrapper>
            <Statusbar
              completed={!commitButtonLoading}
              message={createMessage(COMMITTING_AND_PUSHING_CHANGES)}
              period={6}
            />
          </StatusbarWrapper>
        )}
        {isDiscarding && !isCommitting && (
          <StatusbarWrapper>
            <Statusbar
              completed={!isDiscarding}
              message={createMessage(DISCARDING_AND_PULLING_CHANGES)}
              period={6}
            />
          </StatusbarWrapper>
        )}
      </Section>

      {showDiscardWarning && (
        <DiscardChangesWarning
          discardDocUrl={discardDocUrl}
          onCloseDiscardChangesWarning={onCloseDiscardWarning}
        />
      )}

      {!pullRequired && !isConflicting && (
        <DeployPreview showSuccess={isCommitAndPushSuccessful} />
      )}
      <ScrollIndicator containerRef={scrollWrapperRef} mode="DARK" top="37px" />
    </Container>
  );
}

export default Deploy;
