import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getDisconnectDocUrl,
  getShowRepoLimitErrorModal,
} from "selectors/gitSyncSelectors";
import {
  setDisconnectingGitApplication,
  setIsDisconnectGitModalOpen,
  setShowRepoLimitErrorModal,
} from "actions/gitSyncActions";
import styled from "styled-components";
import {
  Callout,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Text,
} from "@appsmith/ads";
import { Colors } from "constants/Colors";
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
import Link from "./components/Link";
import {
  getCurrentApplication,
  getWorkspaceIdForImport,
} from "ee/selectors/applicationSelectors";
import type { ApplicationPayload } from "entities/Application";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { Space } from "./components/StyledComponents";
import { getFetchedWorkspaces } from "ee/selectors/workspaceSelectors";
import { getApplicationsOfWorkspace } from "ee/selectors/selectedWorkspaceSelectors";

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

function RepoLimitExceededErrorModal() {
  const isOpen = useSelector(getShowRepoLimitErrorModal);
  const dispatch = useDispatch();
  const application = useSelector(getCurrentApplication);
  const applicationsOfWorkspace = useSelector(getApplicationsOfWorkspace);
  const workspaces = useSelector(getFetchedWorkspaces);
  const workspaceIdForImport = useSelector(getWorkspaceIdForImport);
  const docURL = useSelector(getDisconnectDocUrl);
  const [workspaceName, setWorkspaceName] = useState("");
  const applications = useMemo(() => {
    if (workspaces) {
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const workspace: any = workspaces.find((workspace: any) => {
        if (!application && workspaceIdForImport) {
          return workspace.id === workspaceIdForImport;
        } else {
          return workspace.id === application?.workspaceId;
        }
      });

      setWorkspaceName(workspace?.name || "");

      return (
        applicationsOfWorkspace.filter((application: ApplicationPayload) => {
          const data = application.gitApplicationMetadata;

          return (
            data &&
            data.remoteUrl &&
            data.branchName &&
            data.repoName &&
            data.isRepoPrivate
          );
        }) || []
      );
    } else {
      return [];
    }
  }, [workspaces, workspaceIdForImport]);
  const onClose = () => dispatch(setShowRepoLimitErrorModal(false));
  const openDisconnectGitModal = useCallback(
    (applicationId: string, name: string) => {
      AnalyticsUtil.logEvent("GS_DISCONNECT_GIT_CLICK", {
        source: "REPO_LIMIT_EXCEEDED_ERROR_MODAL",
      });
      dispatch(setShowRepoLimitErrorModal(false));
      dispatch(
        setDisconnectingGitApplication({
          id: applicationId,
          name: name,
        }),
      );
      dispatch(setIsDisconnectGitModalOpen(true));
    },
    [],
  );

  useEffect(() => {
    if (isOpen) {
      dispatch({
        type: ReduxActionTypes.FETCH_ALL_APPLICATIONS_OF_WORKSPACE_INIT,
      });
    }
  }, [isOpen]);

  const openIntercom = () => {
    if (window.Intercom) {
      window.Intercom(
        "showNewMessage",
        createMessage(CONTACT_SALES_MESSAGE_ON_INTERCOM, workspaceName),
      );
    }
  };

  return (
    <Modal
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      open={isOpen}
    >
      <ModalContent
        className="t--git-repo-limited-modal"
        style={{ width: "640px" }}
      >
        <ModalHeader isCloseButtonVisible>
          {createMessage(REPOSITORY_LIMIT_REACHED)}
        </ModalHeader>
        <ModalBody>
          <Text kind="body-m">
            {createMessage(REPOSITORY_LIMIT_REACHED_INFO)}
          </Text>
          <Space size={2} />
          <Callout
            kind="warning"
            links={[
              {
                onClick: () => {
                  AnalyticsUtil.logEvent("GS_CONTACT_SALES_CLICK", {
                    source: "REPO_LIMIT_EXCEEDED_ERROR_MODAL",
                  });
                  openIntercom();
                },
                children: createMessage(CONTACT_SUPPORT),
              },
            ]}
          >
            {createMessage(CONTACT_SUPPORT_TO_UPGRADE)}
          </Callout>
          <Space size={15} />
          <Text kind="heading-s">
            {createMessage(REVOKE_EXISTING_REPOSITORIES)}
          </Text>
          <Space size={3} />
          <Text kind="body-m">
            {createMessage(REVOKE_EXISTING_REPOSITORIES_INFO)}
          </Text>
          <Callout
            kind="error"
            links={[
              {
                to: docURL,
                children: createMessage(LEARN_MORE),
              },
            ]}
          >
            {createMessage(REVOKE_CAUSE_APPLICATION_BREAK)}
          </Callout>
          <AppListContainer>
            {applications.map((application: ApplicationPayload) => {
              const { gitApplicationMetadata } = application;

              return (
                <ApplicationWrapper
                  className="t--connected-app-wrapper"
                  key={application.id}
                >
                  <div>
                    <TextWrapper>
                      <Text color={Colors.OXFORD_BLUE} kind="heading-m">
                        {application.name}
                      </Text>
                    </TextWrapper>
                    <TextWrapper>
                      <Text color={Colors.OXFORD_BLUE} kind="body-m">
                        {gitApplicationMetadata?.remoteUrl}
                      </Text>
                    </TextWrapper>
                  </div>
                  <Link
                    className="t--disconnect-link"
                    color={Colors.CRIMSON}
                    hasIcon
                    link=""
                    onClick={() =>
                      openDisconnectGitModal(application.id, application.name)
                    }
                    text={createMessage(REVOKE_ACCESS)}
                  />
                </ApplicationWrapper>
              );
            })}
          </AppListContainer>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default RepoLimitExceededErrorModal;
