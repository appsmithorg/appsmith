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
  GIT_CONNECT_SUCCESS_GENERIC_MESSAGE,
  GIT_CONNECT_SUCCESS_GENERIC_DOC_CTA,
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
import type { GitArtifactType } from "git/constants/enums";
import { GitSettingsTab } from "git/constants/enums";
import { singular } from "pluralize";

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
  artifactType: GitArtifactType | null;
  defaultBranch: string | null;
  isConnectSuccessModalOpen: boolean;
  showProtectedBranchesInfo: boolean;
  remoteUrl: string | null;
  repoName: string | null;
  toggleConnectSuccessModal: (open: boolean) => void;
  toggleSettingsModal: (
    open: boolean,
    tab?: keyof typeof GitSettingsTab,
  ) => void;
}

function ConnectSuccessModalView({
  artifactType = null,
  defaultBranch = null,
  isConnectSuccessModalOpen = false,
  remoteUrl = null,
  repoName = null,
  showProtectedBranchesInfo = false,
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
          {showProtectedBranchesInfo ? (
            <>
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
          ) : (
            <>
              <div className="mb-1">
                <Text renderAs="p">
                  {createMessage(
                    GIT_CONNECT_SUCCESS_GENERIC_MESSAGE,
                    singular(artifactType ?? ""),
                  )}
                </Text>
              </div>
              <LinkText className="inline-block" isBold renderAs="p">
                <Link
                  data-testid="t--git-success-modal-learn-more-link"
                  target="_blank"
                  to={
                    "https://docs.appsmith.com/advanced-concepts/version-control-with-git"
                  }
                >
                  {createMessage(GIT_CONNECT_SUCCESS_GENERIC_DOC_CTA)}
                </Link>
              </LinkText>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          {showProtectedBranchesInfo ? (
            <Button
              data-testid="t--git-con-success-open-settings"
              kind="secondary"
              onClick={handleOpenSettings}
              size="md"
            >
              {createMessage(GIT_CONNECT_SUCCESS_ACTION_SETTINGS)}
            </Button>
          ) : null}
          <Button
            data-testid="t--git-con-success-start-using"
            onClick={handleStartGit}
            size="md"
          >
            {createMessage(
              GIT_CONNECT_SUCCESS_ACTION_CONTINUE,
              singular(artifactType ?? ""),
            )}
          </Button>
        </ModalFooter>
      </StyledModalContent>
    </Modal>
  );
}

export default ConnectSuccessModalView;
