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
import React, { useCallback } from "react";
import styled from "styled-components";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { DOCS_BRANCH_PROTECTION_URL } from "constants/ThirdPartyConstants";
import noop from "lodash/noop";
import type { GitSettingsTab } from "git/constants/enums";

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

interface ConnectSuccessModalViewProps {
  repoName: string | null;
  defaultBranch: string | null;
}

function ConnectSuccessModalView({
  defaultBranch,
  repoName,
}: ConnectSuccessModalViewProps) {
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
          <Text renderAs="p">{repoName || "-"}</Text>
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
          <Text renderAs="p">{defaultBranch || "-"}</Text>
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

interface ConnectSuccessProps {
  defaultBranch: string | null;
  remoteUrl: string | null;
  repoName: string | null;
  toggleConnectModal: (open: boolean) => void;
  toggleSettingsModal: (
    open: boolean,
    tab?: keyof typeof GitSettingsTab,
  ) => void;
}

function ConnectSuccess({
  defaultBranch,
  remoteUrl = null,
  repoName,
  toggleConnectModal = noop,
  toggleSettingsModal = noop,
}: ConnectSuccessProps) {
  const handleStartGit = useCallback(() => {
    toggleConnectModal(false);
    AnalyticsUtil.logEvent("GS_START_USING_GIT", {
      repoUrl: remoteUrl,
    });
  }, [remoteUrl, toggleConnectModal]);

  const handleOpenSettings = useCallback(() => {
    toggleConnectModal(false);
    toggleSettingsModal(true);
    AnalyticsUtil.logEvent("GS_OPEN_GIT_SETTINGS", {
      repoUrl: remoteUrl,
    });
  }, [remoteUrl, toggleConnectModal, toggleSettingsModal]);

  return (
    <>
      <ModalBody data-testid="t--git-success-modal-body">
        <ConnectionSuccessTitle />
        <ConnectSuccessModalView
          defaultBranch={defaultBranch}
          repoName={repoName}
        />
      </ModalBody>
      <ModalFooter>
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
      </ModalFooter>
    </>
  );
}

export default ConnectSuccess;
