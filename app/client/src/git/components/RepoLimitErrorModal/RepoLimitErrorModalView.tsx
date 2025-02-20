import React, { useCallback, useEffect, useMemo } from "react";
import styled from "styled-components";
import {
  Button,
  Callout,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Text,
} from "@appsmith/ads";
import {
  CONTACT_SALES_MESSAGE_ON_INTERCOM,
  CONTACT_SUPPORT,
  CONTACT_SUPPORT_TO_UPGRADE,
  createMessage,
  REVOKE_CAUSE_APPLICATION_BREAK,
  REVOKE_EXISTING_REPOSITORIES_INFO,
  LEARN_MORE,
  REPOSITORY_LIMIT_REACHED,
  REPOSITORY_LIMIT_REACHED_INFO,
  REVOKE_ACCESS,
  REVOKE_EXISTING_REPOSITORIES,
} from "ee/constants/messages";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { noop } from "lodash";
import type {
  GitApplicationArtifact,
  GitArtifact,
  GitArtifactDef,
  GitPackageArtifact,
} from "git/types";
import { applicationArtifact } from "git-artifact-helpers/application";

const StyledModalContent = styled(ModalContent)`
  &&& {
    width: 640px;
  }
`;

const ApplicationWrapper = styled.div`
  margin-bottom: ${(props) => props.theme.spaces[7]}px;
  display: flex;
  justify-content: space-between;

  & > div {
    max-width: 60%;
  }
`;

const TextWrapper = styled.div`
  display: block;
  word-break: break-word;
`;

const AppListContainer = styled.div`
  height: calc(100% - 40px);
  margin-top: 16px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 5px;
  position: relative;
`;

const DISCONNECT_DOC_URL =
  "https://docs.appsmith.com/advanced-concepts/version-control-with-git/disconnect-the-git-repository";

interface RepoLimitErrorModalViewProps {
  artifacts: GitArtifact[] | null;
  fetchArtifacts: () => void;
  isRepoLimitErrorModalOpen: boolean;
  openDisconnectModal: (
    targetArtifactDef: GitArtifactDef,
    targetArtifactName: string,
  ) => void;
  toggleRepoLimitErrorModal: (open: boolean) => void;
  workspaceName: string | null;
}

function RepoLimitErrorModalView({
  artifacts = null,
  fetchArtifacts = noop,
  isRepoLimitErrorModalOpen = false,
  openDisconnectModal = noop,
  toggleRepoLimitErrorModal = noop,
  workspaceName = null,
}: RepoLimitErrorModalViewProps) {
  const gitConnectedArtifacts = useMemo(() => {
    return (
      artifacts?.filter((artifact: GitArtifact) => {
        const gitMetadata =
          (artifact as GitApplicationArtifact).gitApplicationMetadata ||
          (artifact as GitPackageArtifact).gitArtifactMetadata;

        return (
          gitMetadata &&
          gitMetadata.remoteUrl &&
          gitMetadata.branchName &&
          gitMetadata.repoName &&
          gitMetadata.isRepoPrivate
        );
      }) ?? []
    );
  }, [artifacts]);

  useEffect(
    function fetchArtifactsOnModalOpenEffect() {
      if (isRepoLimitErrorModalOpen) {
        fetchArtifacts();
      }
    },
    [fetchArtifacts, isRepoLimitErrorModalOpen],
  );

  const contactSupportLinks = useMemo(
    () => [
      {
        onClick: () => {
          AnalyticsUtil.logEvent("GS_CONTACT_SALES_CLICK", {
            source: "REPO_LIMIT_EXCEEDED_ERROR_MODAL",
          });

          if (window.Intercom) {
            window.Intercom(
              "showNewMessage",
              createMessage(CONTACT_SALES_MESSAGE_ON_INTERCOM, workspaceName),
            );
          }
        },
        children: createMessage(CONTACT_SUPPORT),
      },
    ],
    [workspaceName],
  );

  const revokeWarningLinks = useMemo(
    () => [
      {
        to: DISCONNECT_DOC_URL,
        children: createMessage(LEARN_MORE),
      },
    ],
    [],
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        toggleRepoLimitErrorModal(false);
      }
    },
    [toggleRepoLimitErrorModal],
  );

  const handleOnClickDisconnect = useCallback(
    (baseArtifactId: string, artifactName: string) => () => {
      AnalyticsUtil.logEvent("GS_DISCONNECT_GIT_CLICK", {
        source: "REPO_LIMIT_EXCEEDED_ERROR_MODAL",
      });
      toggleRepoLimitErrorModal(false);
      openDisconnectModal(applicationArtifact(baseArtifactId), artifactName);
    },
    [openDisconnectModal, toggleRepoLimitErrorModal],
  );

  return (
    <Modal onOpenChange={handleOpenChange} open={isRepoLimitErrorModalOpen}>
      <StyledModalContent data-testid="t--git-repo-limit-error-modal">
        <ModalHeader isCloseButtonVisible>
          {createMessage(REPOSITORY_LIMIT_REACHED)}
        </ModalHeader>
        <ModalBody>
          <div className="mb-5">
            <Text className="mb-2" kind="body-m" renderAs="p">
              {createMessage(REPOSITORY_LIMIT_REACHED_INFO)}
            </Text>
            <Callout kind="warning" links={contactSupportLinks}>
              {createMessage(CONTACT_SUPPORT_TO_UPGRADE)}
            </Callout>
          </div>
          <div>
            <Text className="mb-3" kind="heading-s" renderAs="p">
              {createMessage(REVOKE_EXISTING_REPOSITORIES)}
            </Text>
            <Text className="mb-2" kind="body-m" renderAs="p">
              {createMessage(REVOKE_EXISTING_REPOSITORIES_INFO)}
            </Text>
            <Callout kind="error" links={revokeWarningLinks}>
              {createMessage(REVOKE_CAUSE_APPLICATION_BREAK)}
            </Callout>
          </div>
          <AppListContainer>
            {gitConnectedArtifacts.map((artifact) => {
              const gitMetadata =
                (artifact as GitApplicationArtifact).gitApplicationMetadata ||
                (artifact as GitPackageArtifact).gitArtifactMetadata;

              return (
                <ApplicationWrapper
                  data-testid="t--git-repo-limit-error-connected-artifact"
                  key={artifact.id}
                >
                  <div>
                    <TextWrapper>
                      <Text kind="heading-m">{artifact.name}</Text>
                    </TextWrapper>
                    <TextWrapper>
                      <Text kind="body-m">{gitMetadata?.remoteUrl}</Text>
                    </TextWrapper>
                  </div>
                  <Button
                    data-testid="t--git-repo-limit-error-disconnect-link"
                    endIcon="arrow-right-line"
                    kind="tertiary"
                    onClick={handleOnClickDisconnect(
                      artifact.baseId,
                      artifact.name,
                    )}
                  >
                    {createMessage(REVOKE_ACCESS)}
                  </Button>
                </ApplicationWrapper>
              );
            })}
          </AppListContainer>
        </ModalBody>
      </StyledModalContent>
    </Modal>
  );
}

export default RepoLimitErrorModalView;
