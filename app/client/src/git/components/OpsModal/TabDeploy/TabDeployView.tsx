import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ARE_YOU_SURE,
  COMMIT_AND_PUSH,
  COMMIT_TO,
  COMMITTING_AND_PUSHING_CHANGES,
  createMessage,
  DISCARD_CHANGES,
  DISCARD_SUCCESS,
  DISCARDING_AND_PULLING_CHANGES,
  GIT_NO_UPDATED_TOOLTIP,
  PULL_CHANGES,
} from "ee/constants/messages";
import styled from "styled-components";
import {
  Button,
  Input,
  ModalBody,
  ModalFooter,
  Text,
  Tooltip,
} from "@appsmith/ads";
import DeployPreview from "./DeployPreview";
import Statusbar, {
  StatusbarWrapper,
} from "pages/Editor/gitSync/components/Statusbar";

import { isEllipsisActive } from "utils/helpers";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import GIT_ERROR_CODES from "constants/GitErrorCodes";
import DiscardChangesWarning from "./DiscardChangesWarning";
import PushFailedError from "./PushFailedError";
import DiscardFailedError from "./DiscardFailedError";
import StatusChanges from "git/components/StatusChanges";
import ConflictError from "git/components/ConflictError";
import SubmitWrapper from "./SubmitWrapper";
import noop from "lodash/noop";
import type { GitApiError } from "git/store/types";

const Section = styled.div`
  margin-top: 0;
  margin-bottom: ${(props) => props.theme.spaces[7]}px;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
`;

const StyledModalFooter = styled(ModalFooter)`
  min-height: 52px;
`;

const CommitLabelText = styled(Text)`
  min-width: fit-content;
`;

const CommitLabelBranchText = styled(Text)`
  overflow: hidden;
  text-overflow: ellipsis;
  whitespace: nowrap;
`;

const NO_CHANGES_TO_COMMIT = "No changes to commit";

interface TabDeployViewProps {
  clearCommitError: () => void;
  clearDiscardError: () => void;
  commit: (commitMessage: string) => void;
  commitError: GitApiError | null;
  currentBranch: string | null;
  discard: (successMessage: string) => void;
  discardError: GitApiError | null;
  isCommitLoading: boolean;
  isDiscardLoading: boolean;
  isFetchStatusLoading: boolean;
  isPullFailing: boolean;
  isPullLoading: boolean;
  pull: () => void;
  statusBehindCount: number;
  statusIsClean: boolean;
}

function TabDeployView({
  clearCommitError = noop,
  clearDiscardError = noop,
  commit = noop,
  commitError = null,
  currentBranch = null,
  discard = noop,
  discardError = null,
  isCommitLoading = false,
  isDiscardLoading = false,
  isFetchStatusLoading = false,
  isPullFailing = false,
  isPullLoading = false,
  pull = noop,
  statusBehindCount = 0,
  statusIsClean = false,
}: TabDeployViewProps) {
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const hasChangesToCommit = !statusIsClean;
  const commitInputRef = useRef<HTMLInputElement>(null);
  const [commitMessage, setCommitMessage] = useState("");
  const [shouldDiscard, setShouldDiscard] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(isDiscardLoading);
  const [showDiscardWarning, setShowDiscardWarning] = useState(false);

  const commitButtonDisabled =
    !hasChangesToCommit || !commitMessage || commitMessage.trim().length < 1;
  const commitButtonLoading = isCommitLoading;

  const commitRequired = !statusIsClean;
  const isConflicting = !isFetchStatusLoading && !!isPullFailing;
  const commitInputDisabled =
    isConflicting || !hasChangesToCommit || isCommitLoading || isDiscarding;
  const pullRequired =
    commitError?.code ===
    GIT_ERROR_CODES.PUSH_FAILED_REMOTE_COUNTERPART_IS_AHEAD;

  const showCommitButton =
    !isConflicting &&
    !pullRequired &&
    !isFetchStatusLoading &&
    !isCommitLoading &&
    !isDiscarding;

  const isCommitting =
    !!commitButtonLoading &&
    (commitRequired || showCommitButton) &&
    !isDiscarding;

  const showDiscardChangesButton =
    !isFetchStatusLoading &&
    !isCommitLoading &&
    hasChangesToCommit &&
    !isDiscarding &&
    !isCommitting;

  const commitMessageDisplay = hasChangesToCommit
    ? commitMessage
    : NO_CHANGES_TO_COMMIT;

  const showPullButton =
    !isFetchStatusLoading &&
    ((pullRequired && !isConflicting) ||
      (statusBehindCount > 0 && statusIsClean));

  const isCommitSuccess = useMemo(() => {
    return hasSubmitted && !isCommitLoading;
  }, [isCommitLoading, hasSubmitted]);

  useEffect(
    function focusCommitInputEffect() {
      if (!commitInputDisabled && commitInputRef.current) {
        commitInputRef.current.focus();
      }
    },
    [commitInputDisabled],
  );

  useEffect(
    function discardErrorChangeEffect() {
      if (discardError) {
        setIsDiscarding(false);
        setShouldDiscard(false);
      }
    },
    [discardError],
  );

  const scrollWrapperRef = React.createRef<HTMLDivElement>();

  useEffect(
    function scrollContainerToTopEffect() {
      if (scrollWrapperRef.current) {
        setTimeout(() => {
          const top = scrollWrapperRef.current?.scrollHeight || 0;

          scrollWrapperRef.current?.scrollTo({
            top: top,
          });
        }, 100);
      }
    },
    [scrollWrapperRef],
  );

  const triggerCommit = useCallback(() => {
    setShowDiscardWarning(false);
    AnalyticsUtil.logEvent("GS_COMMIT_AND_PUSH_BUTTON_CLICK", {
      source: "GIT_DEPLOY_MODAL",
    });

    if (currentBranch) {
      setHasSubmitted(true);
      commit(commitMessage.trim());
    }
  }, [commit, commitMessage, currentBranch]);

  const handleCommitViaKeyPress = useCallback(() => {
    if (!commitButtonDisabled) {
      triggerCommit();
    }
  }, [commitButtonDisabled, triggerCommit]);

  const triggerPull = useCallback(() => {
    AnalyticsUtil.logEvent("GS_PULL_GIT_CLICK", {
      source: "GIT_DEPLOY_MODAL",
    });

    if (currentBranch) {
      pull();
    }
  }, [currentBranch, pull]);

  const triggerDiscardInit = useCallback(() => {
    AnalyticsUtil.logEvent("GIT_DISCARD_WARNING", {
      source: "GIT_DISCARD_BUTTON_PRESS_1",
    });
    setShowDiscardWarning(true);
    setShouldDiscard(true);
    clearDiscardError();
  }, [clearDiscardError]);

  const triggerDiscardChanges = useCallback(() => {
    AnalyticsUtil.logEvent("GIT_DISCARD", {
      source: "GIT_DISCARD_BUTTON_PRESS_2",
    });
    discard(createMessage(DISCARD_SUCCESS));
    setShowDiscardWarning(false);
    setShouldDiscard(true);
    setIsDiscarding(true);
  }, [discard]);

  const handleDiscardBtnClick = useCallback(() => {
    if (shouldDiscard) {
      triggerDiscardChanges();
    } else {
      triggerDiscardInit();
    }
  }, [shouldDiscard, triggerDiscardChanges, triggerDiscardInit]);

  const onCloseDiscardWarning = useCallback(() => {
    AnalyticsUtil.logEvent("GIT_DISCARD_CANCEL", {
      source: "GIT_DISCARD_WARNING_BANNER_CLOSE_CLICK",
    });
    setShowDiscardWarning(false);
    setShouldDiscard(false);
  }, []);

  function handleCommitAndPushErrorClose() {
    clearCommitError();
  }

  function handleDiscardErrorClose() {
    clearDiscardError();
  }

  const inputLabel = useMemo(
    () => (
      <Row>
        <CommitLabelText>{createMessage(COMMIT_TO)}</CommitLabelText>
        <Tooltip
          content={currentBranch}
          isDisabled={
            !isEllipsisActive(
              document.getElementById("git-branch-name-commit-tab"),
            )
          }
        >
          <CommitLabelBranchText
            className="branch"
            color={"var(--ads-v2-color-fg-brand)"}
            id="git-branch-name-commit-tab"
          >
            &nbsp;{currentBranch}
          </CommitLabelBranchText>
        </Tooltip>
      </Row>
    ),
    [currentBranch],
  );

  return (
    <>
      <ModalBody>
        <div
          data-testid={"t--deploy-tab-container"}
          ref={scrollWrapperRef}
          style={{ minHeight: 360 }}
        >
          <Section>
            <StatusChanges />
            <SubmitWrapper onSubmit={handleCommitViaKeyPress}>
              <Input
                autoFocus
                data-testid="t--git-ops-commit-input"
                isDisabled={commitInputDisabled}
                label={inputLabel}
                onChange={setCommitMessage}
                placeholder={"Your commit message here"}
                ref={commitInputRef}
                renderAs="textarea"
                size="md"
                type="text"
                value={commitMessageDisplay}
              />
            </SubmitWrapper>
            {isConflicting && <ConflictError />}
            {commitError && (
              <PushFailedError
                closeHandler={handleCommitAndPushErrorClose}
                error={commitError}
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
            <DiscardFailedError
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
            <DeployPreview isCommitSuccess={isCommitSuccess} />
          )}
        </div>
      </ModalBody>
      <StyledModalFooter key="footer">
        {showPullButton && (
          <Button
            data-testid="t--git-ops-pull-btn"
            isLoading={isPullLoading}
            onClick={triggerPull}
            size="md"
          >
            {createMessage(PULL_CHANGES)}
          </Button>
        )}

        {showDiscardChangesButton && (
          <Button
            className="discard-changes-link"
            data-testid="t--git-ops-discard-btn"
            isDisabled={!showDiscardChangesButton}
            isLoading={isPullLoading || isFetchStatusLoading || isCommitLoading}
            kind="error"
            onClick={handleDiscardBtnClick}
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
              data-testid="t--git-ops-commit-btn"
              isDisabled={commitButtonDisabled}
              isLoading={commitButtonLoading}
              onClick={triggerCommit}
              size="md"
            >
              {createMessage(COMMIT_AND_PUSH)}
            </Button>
          </Tooltip>
        )}
      </StyledModalFooter>
    </>
  );
}

export default TabDeployView;
