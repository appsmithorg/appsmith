import React, { useEffect, useRef, useState } from "react";
import {
  ARE_YOU_SURE,
  COMMIT_AND_PUSH,
  COMMIT_TO,
  COMMITTING_AND_PUSHING_CHANGES,
  createMessage,
  DISCARD_CHANGES,
  DISCARDING_AND_PULLING_CHANGES,
  FETCH_GIT_STATUS,
  GIT_NO_UPDATED_TOOLTIP,
  GIT_UPSTREAM_CHANGES,
  PULL_CHANGES,
  READ_DOCUMENTATION,
} from "ee/constants/messages";
import styled from "styled-components";
import {
  Button,
  Callout,
  Input,
  ModalBody,
  ModalFooter,
  Text,
  Tooltip,
} from "@appsmith/ads";
import {
  getConflictFoundDocUrlDeploy,
  getGitCommitAndPushError,
  getGitDiscardError,
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

import {
  getCurrentAppGitMetaData,
  getCurrentApplication,
} from "ee/selectors/applicationSelectors";
import DeployPreview from "../components/DeployPreview";
import {
  clearCommitErrorState,
  clearCommitSuccessfulState,
  clearDiscardErrorState,
  commitToRepoInit,
  discardChanges,
  gitPullInit,
} from "actions/gitSyncActions";
import StatusLoader from "../components/StatusLoader";
import Statusbar, {
  StatusbarWrapper,
} from "pages/Editor/gitSync/components/Statusbar";
import GitChangesList from "../components/GitChangesList";
import ConflictInfo from "../components/ConflictInfo";

import { isEllipsisActive, isMacOrIOS } from "utils/helpers";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { getApplicationLastDeployedAt } from "selectors/editorSelectors";
import GIT_ERROR_CODES from "constants/GitErrorCodes";
import { Container, Space } from "../components/StyledComponents";
import DiscardChangesWarning from "../components/DiscardChangesWarning";
import { changeInfoSinceLastCommit } from "../utils";
import type { GitStatusData } from "reducers/uiReducers/gitSyncReducer";
import PushFailedWarning from "../components/PushFailedWarning";
import DiscardFailedWarning from "../components/DiscardChangesError";

const Section = styled.div`
  margin-top: 0;
  margin-bottom: ${(props) => props.theme.spaces[7]}px;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
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
  const discardError = useSelector(getGitDiscardError);
  const pullFailed = useSelector(getPullFailed);
  const commitInputRef = useRef<HTMLInputElement>(null);
  const upstreamErrorDocumentUrl = useSelector(getUpstreamErrorDocUrl);
  const [commitMessage, setCommitMessage] = useState(
    gitMetaData?.remoteUrl && lastDeployedAt ? "" : FIRST_COMMIT,
  );
  const [shouldDiscard, setShouldDiscard] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(isDiscardInProgress);
  const [showDiscardWarning, setShowDiscardWarning] = useState(false);

  const currentBranch = gitMetaData?.branchName;
  const dispatch = useDispatch();

  const currentApplication = useSelector(getCurrentApplication);
  const { changeReasonText, isAutoUpdate, isManualUpdate } =
    changeInfoSinceLastCommit(currentApplication);

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
    return () => {
      dispatch(clearCommitSuccessfulState());
    };
  }, []);

  const commitButtonDisabled =
    !hasChangesToCommit || !commitMessage || commitMessage.trim().length < 1;
  const commitButtonLoading = isCommittingInProgress;

  const commitRequired = !gitStatus?.isClean;
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

  useEffect(() => {
    if (!commitInputDisabled && commitInputRef.current) {
      commitInputRef.current.focus();
    }
  }, [commitInputDisabled]);

  const gitConflictDocumentUrl = useSelector(getConflictFoundDocUrlDeploy);

  // const autogrowHeight = useAutoGrow(commitMessageDisplay, 37);

  const onDiscardInit = () => {
    AnalyticsUtil.logEvent("GIT_DISCARD_WARNING", {
      source: "GIT_DISCARD_BUTTON_PRESS_1",
    });
    setShowDiscardWarning(true);
    setShouldDiscard(true);
    dispatch(clearDiscardErrorState());
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

  useEffect(() => {
    if (discardError) {
      setIsDiscarding(false);
      setShouldDiscard(false);
    }
  }, [discardError]);

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

  function handleDiscardErrorClose() {
    dispatch(clearDiscardErrorState());
  }

  return (
    <>
      <ModalBody>
        <Container
          data-testid={"t--deploy-tab-container"}
          ref={scrollWrapperRef}
          style={{ minHeight: 360 }}
        >
          <Section>
            {hasChangesToCommit && (
              <Text
                color={"var(--ads-v2-color-fg-emphasis)"}
                data-testid={"t--git-deploy-change-reason-text"}
                kind="heading-s"
              >
                {changeReasonText}
              </Text>
            )}
            <GitChangesList />
            <SubmitWrapper
              onSubmit={() => {
                if (!commitButtonDisabled) handleCommit(true);
              }}
            >
              <Input
                autoFocus
                className="t--commit-comment-input"
                isDisabled={commitInputDisabled}
                label={
                  <Row>
                    <Text style={{ minWidth: "fit-content" }}>
                      {createMessage(COMMIT_TO)}
                    </Text>
                    <Tooltip
                      content={currentBranch}
                      isDisabled={
                        !isEllipsisActive(
                          document.getElementById(
                            "git-branch-name-commmit-tab",
                          ),
                        )
                      }
                    >
                      <Text
                        className="branch"
                        color={"var(--ads-v2-color-fg-brand)"}
                        id="git-branch-name-commmit-tab"
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        &nbsp;{currentBranch}
                      </Text>
                    </Tooltip>
                  </Row>
                }
                onChange={setCommitMessage}
                placeholder={"Your commit message here"}
                ref={commitInputRef}
                renderAs="textarea"
                size="md"
                type="text"
                value={commitMessageDisplay}
              />
            </SubmitWrapper>
            {isFetchingGitStatus && (
              <StatusLoader loaderMsg={createMessage(FETCH_GIT_STATUS)} />
            )}
            {/* <Space size={11} /> */}
            {pullRequired && !isConflicting && (
              <>
                <Callout
                  kind="warning"
                  links={[
                    {
                      children: createMessage(READ_DOCUMENTATION),
                      onClick: () => {
                        AnalyticsUtil.logEvent(
                          "GS_GIT_DOCUMENTATION_LINK_CLICK",
                          {
                            source: "UPSTREAM_CHANGES_LINK_ON_GIT_DEPLOY_MODAL",
                          },
                        );
                      },
                      to: upstreamErrorDocumentUrl,
                      target: "_blank",
                    },
                  ]}
                >
                  {createMessage(GIT_UPSTREAM_CHANGES)}
                </Callout>
                <Space size={3} />
              </>
            )}
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

          {discardError && (
            <DiscardFailedWarning
              closeHandler={handleDiscardErrorClose}
              error={discardError}
            />
          )}

          {showDiscardWarning && (
            <DiscardChangesWarning
              onCloseDiscardChangesWarning={onCloseDiscardWarning}
            />
          )}

          {!pullRequired && !isConflicting && (
            <DeployPreview showSuccess={isCommitAndPushSuccessful} />
          )}
        </Container>
      </ModalBody>
      <ModalFooter key="footer" style={{ minHeight: 52 }}>
        {showPullButton && (
          <Button
            className="t--pull-button"
            isLoading={isPullingProgress}
            onClick={handlePull}
            size="md"
          >
            {createMessage(PULL_CHANGES)}
          </Button>
        )}

        {showDiscardChangesButton && (
          <Button
            className="t--discard-button discard-changes-link"
            isDisabled={!showDiscardChangesButton}
            isLoading={
              isPullingProgress || isFetchingGitStatus || isCommittingInProgress
            }
            kind="error"
            onClick={() =>
              shouldDiscard ? onDiscardChanges() : onDiscardInit()
            }
            size="md"
          >
            {showDiscardWarning
              ? createMessage(ARE_YOU_SURE)
              : createMessage(DISCARD_CHANGES)}
          </Button>
        )}
        {showCommitButton && (
          <Tooltip
            content={createMessage(GIT_NO_UPDATED_TOOLTIP)}
            isDisabled={showCommitButton && !commitButtonLoading}
            placement="top"
          >
            <Button
              className="t--commit-button"
              isDisabled={commitButtonDisabled}
              isLoading={commitButtonLoading}
              onClick={() => handleCommit(true)}
              size="md"
            >
              {commitButtonText}
            </Button>
          </Tooltip>
        )}
      </ModalFooter>
    </>
  );
}

export default Deploy;
