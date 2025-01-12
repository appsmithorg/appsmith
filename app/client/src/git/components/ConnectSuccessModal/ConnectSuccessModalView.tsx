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
  Modal,
  ModalContent,
} from "@appsmith/ads";
import React, { useCallback } from "react";
import styled from "styled-components";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { DOCS_BRANCH_PROTECTION_URL } from "constants/ThirdPartyConstants";
import noop from "lodash/noop";
import { GitSettingsTab } from "git/constants/enums";

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

interface ConnectSuccessContentProps {
  repoName: string | null;
  defaultBranch: string | null;
}

function ConnectSuccessContent({
  defaultBranch,
  repoName,
}: ConnectSuccessContentProps) {
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

const StyledModalContent = styled(ModalContent)`
  &&& {
    width: 640px;
    transform: none !important;
    top: 100px;
    left: calc(50% - 320px);
    max-height: calc(100vh - 200px);
  }
`;

export interface ConnectSuccessModalViewProps {
  defaultBranch: string | null;
  isConnectSuccessModalOpen: boolean;
  remoteUrl: string | null;
  repoName: string | null;
  toggleConnectSuccessModal: (open: boolean) => void;
  toggleSettingsModal: (
    open: boolean,
    tab?: keyof typeof GitSettingsTab,
  ) => void;
}

function ConnectSuccessModalView({
  defaultBranch = null,
  isConnectSuccessModalOpen = false,
  remoteUrl = null,
  repoName = null,
  toggleConnectSuccessModal = noop,
  toggleSettingsModal = noop,
}: ConnectSuccessModalViewProps) {
  const handleStartGit = useCallback(() => {
    toggleConnectSuccessModal(false);
    AnalyticsUtil.logEvent("GS_START_USING_GIT", {
      repoUrl: remoteUrl,
    });
  }, [remoteUrl, toggleConnectSuccessModal]);

  const handleOpenSettings = useCallback(() => {
    toggleConnectSuccessModal(false);
    toggleSettingsModal(true, GitSettingsTab.Branch);
    AnalyticsUtil.logEvent("GS_OPEN_GIT_SETTINGS", {
      repoUrl: remoteUrl,
    });
  }, [remoteUrl, toggleConnectSuccessModal, toggleSettingsModal]);

  return (
    <Modal
      onOpenChange={toggleConnectSuccessModal}
      open={isConnectSuccessModalOpen}
    >
      <StyledModalContent data-testid="t--git-con-success-modal">
        <ModalBody>
          <ConnectionSuccessTitle />
          <ConnectSuccessContent
            defaultBranch={defaultBranch}
            repoName={repoName}
          />
        </ModalBody>
        <ModalFooter>
          <Button
            data-testid="t--git-con-success-open-settings"
            kind="secondary"
            onClick={handleOpenSettings}
            size="md"
          >
            {createMessage(GIT_CONNECT_SUCCESS_ACTION_SETTINGS)}
          </Button>
          <Button
            data-testid="t--git-con-success-start-using"
            onClick={handleStartGit}
            size="md"
          >
            {createMessage(GIT_CONNECT_SUCCESS_ACTION_CONTINUE)}
          </Button>
        </ModalFooter>
      </StyledModalContent>
    </Modal>
  );
}

export default ConnectSuccessModalView;
