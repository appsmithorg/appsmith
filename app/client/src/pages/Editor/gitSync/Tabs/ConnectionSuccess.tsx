import {
  fetchBranchesInit,
  setGitSettingsModalOpenAction,
  setIsGitSyncModalOpen,
} from "actions/gitSyncActions";
import {
  GIT_CONNECT_SUCCESS_PROTECTION_MSG,
  GIT_CONNECT_SUCCESS_TITLE,
  GIT_CONNECT_SUCCESS_ACTION_SETTINGS,
  GIT_CONNECT_SUCCESS_ACTION_CONTINUE,
  createMessage,
  GIT_CONNECT_SUCCESS_PROTECTION_DOC_CTA,
  GIT_CONNECT_SUCCESS_DEFAULT_BRANCH,
  GIT_CONNECT_SUCCESS_REPO_NAME,
  GIT_CONNECT_SUCCESS_DEFAULT_BRANCH_TOOLTIP,
} from "ee/constants/messages";
import {
  Button,
  Icon,
  ModalBody,
  ModalFooter,
  Text,
  Link,
  Tooltip,
} from "@appsmith/ads";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { getCurrentAppGitMetaData } from "ee/selectors/applicationSelectors";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { GitSettingsTab } from "reducers/uiReducers/gitSyncReducer";
import { DOCS_BRANCH_PROTECTION_URL } from "constants/ThirdPartyConstants";

const TitleText = styled(Text)`
  flex: 1;
  font-weight: 600;
`;

const LinkText = styled(Text)`
  span {
    font-weight: 500;
  }
`;

function ConnectionSuccessTitle() {
  return (
    <div className="flex items-center mb-4">
      <Icon className="mr-1" color="#059669" name="oval-check" size="lg" />
      <TitleText
        data-testid="t--git-success-modal-title"
        kind="heading-s"
        renderAs="h3"
      >
        {createMessage(GIT_CONNECT_SUCCESS_TITLE)}
      </TitleText>
    </div>
  );
}

function ConnectionSuccessBody() {
  const gitMetadata = useSelector(getCurrentAppGitMetaData);
  return (
    <>
      <div className="flex gap-x-4 mb-6">
        <div className="w-44">
          <div className="flex items-center">
            <Icon className="mr-1" name="git-repository" size="md" />
            <Text isBold renderAs="p">
              {createMessage(GIT_CONNECT_SUCCESS_REPO_NAME)}
            </Text>
          </div>
          <Text renderAs="p">{gitMetadata?.repoName || "-"}</Text>
        </div>
        <div className="w-44">
          <div className="flex items-center">
            <Icon className="mr-1" name="git-branch" size="md" />
            <Text isBold renderAs="p">
              {createMessage(GIT_CONNECT_SUCCESS_DEFAULT_BRANCH)}
            </Text>
            <Tooltip
              content={createMessage(
                GIT_CONNECT_SUCCESS_DEFAULT_BRANCH_TOOLTIP,
              )}
              trigger="hover"
            >
              <Icon
                className="inline-fix ml-1 cursor-pointer"
                name="info"
                size="md"
              />
            </Tooltip>
          </div>
          <Text renderAs="p">{gitMetadata?.defaultBranchName || "-"}</Text>
        </div>
      </div>
      <div className="mb-1">
        <Text renderAs="p">
          {createMessage(GIT_CONNECT_SUCCESS_PROTECTION_MSG)}
        </Text>
      </div>
      <LinkText className="inline-block" isBold renderAs="p">
        <Link
          data-testid="t--git-success-modal-learn-more-link"
          target="_blank"
          to={DOCS_BRANCH_PROTECTION_URL}
        >
          {createMessage(GIT_CONNECT_SUCCESS_PROTECTION_DOC_CTA)}
        </Link>
      </LinkText>
    </>
  );
}

function ConnectionSuccessActions() {
  const gitMetadata = useSelector(getCurrentAppGitMetaData);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchBranchesInit());
  }, []);

  const handleStartGit = () => {
    dispatch(
      setIsGitSyncModalOpen({
        isOpen: false,
      }),
    );
    AnalyticsUtil.logEvent("GS_START_USING_GIT", {
      repoUrl: gitMetadata?.remoteUrl,
    });
  };

  const handleOpenSettings = () => {
    dispatch(
      setIsGitSyncModalOpen({
        isOpen: false,
      }),
    );
    dispatch(
      setGitSettingsModalOpenAction({
        open: true,
        tab: GitSettingsTab.BRANCH,
      }),
    );
    AnalyticsUtil.logEvent("GS_OPEN_GIT_SETTINGS", {
      repoUrl: gitMetadata?.remoteUrl,
    });
  };

  return (
    <>
      <Button
        data-testid="t--git-success-modal-open-settings-cta"
        kind="secondary"
        onClick={handleOpenSettings}
        size="md"
      >
        {createMessage(GIT_CONNECT_SUCCESS_ACTION_SETTINGS)}
      </Button>
      <Button
        data-testid="t--git-success-modal-start-using-git-cta"
        onClick={handleStartGit}
        size="md"
      >
        {createMessage(GIT_CONNECT_SUCCESS_ACTION_CONTINUE)}
      </Button>
    </>
  );
}

function ConnectionSuccess() {
  return (
    <>
      <ModalBody data-testid="t--git-success-modal-body">
        <ConnectionSuccessTitle />
        <ConnectionSuccessBody />
      </ModalBody>
      <ModalFooter>
        <ConnectionSuccessActions />
      </ModalFooter>
    </>
  );
}

export default ConnectionSuccess;
