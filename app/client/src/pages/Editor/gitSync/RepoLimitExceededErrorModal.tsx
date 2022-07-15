import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Dialog from "components/ads/DialogComponent";
import {
  getDisconnectDocUrl,
  getShowRepoLimitErrorModal,
} from "selectors/gitSyncSelectors";
import {
  setDisconnectingGitApplication,
  setIsDisconnectGitModalOpen,
  setShowRepoLimitErrorModal,
} from "actions/gitSyncActions";
import Button, { Category, Size } from "components/ads/Button";
import styled, { useTheme } from "styled-components";
import { Text, TextType } from "design-system";
import { Colors } from "constants/Colors";
import {
  CONTACT_SALES_MESSAGE_ON_INTERCOM,
  CONTACT_SUPPORT,
  CONTACT_SUPPORT_TO_UPGRADE,
  createMessage,
  DISCONNECT_CAUSE_APPLICATION_BREAK,
  DISCONNECT_EXISTING_REPOSITORIES,
  DISCONNECT_EXISTING_REPOSITORIES_INFO,
  LEARN_MORE,
  REPOSITORY_LIMIT_REACHED,
  REPOSITORY_LIMIT_REACHED_INFO,
  REVOKE_ACCESS,
} from "@appsmith/constants/messages";
import Icon, { IconSize } from "components/ads/Icon";
import Link from "./components/Link";
import { get } from "lodash";
import { Theme } from "constants/DefaultTheme";
import {
  getCurrentApplication,
  getUserApplicationsWorkspaces,
} from "selectors/applicationSelectors";
import {
  ApplicationPayload,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import AnalyticsUtil from "utils/AnalyticsUtil";
import InfoWrapper from "./components/InfoWrapper";

const Container = styled.div`
  height: 600px;
  width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-y: hidden;
`;

const BodyContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const CloseBtnContainer = styled.div`
  position: absolute;
  right: 0;
  top: 0;
`;

const ButtonContainer = styled.div`
  margin-top: 0;
`;

const ApplicationWrapper = styled.div`
  margin-bottom: ${(props) => props.theme.spaces[7]}px;
  display: flex;
  justify-content: space-between;
`;

const TextWrapper = styled.div`
  display: block;
`;

const AppListContainer = styled.div`
  height: calc(100% - 40px);
  margin-top: 16px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  padding-right: 5px;

  &::-webkit-scrollbar-thumb {
    background-color: rgba(75, 72, 72, 0.5);
    width: 4px;
    border-radius: ${(props) => props.theme.radii[3]}px;
  }

  &::-webkit-scrollbar {
    width: 4px;
  }
  position: relative;
`;

function RepoLimitExceededErrorModal() {
  const isOpen = useSelector(getShowRepoLimitErrorModal);
  const dispatch = useDispatch();
  const application = useSelector(getCurrentApplication);
  const userWorkspaces = useSelector(getUserApplicationsWorkspaces);
  const docURL = useSelector(getDisconnectDocUrl);
  const [workspaceName, setWorkspaceName] = useState("");
  const applications = useMemo(() => {
    if (userWorkspaces) {
      const workspace: any = userWorkspaces.find((workspaceObject: any) => {
        const { workspace } = workspaceObject;
        return workspace.id === application?.workspaceId;
      });
      setWorkspaceName(workspace?.workspace.name || "");
      return (
        workspace?.applications.filter((application: ApplicationPayload) => {
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
  }, [userWorkspaces]);
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
  const theme = useTheme() as Theme;

  useEffect(() => {
    dispatch({
      type: ReduxActionTypes.GET_ALL_APPLICATION_INIT,
    });
  }, []);

  const openIntercom = () => {
    if (window.Intercom) {
      window.Intercom(
        "showNewMessage",
        createMessage(CONTACT_SALES_MESSAGE_ON_INTERCOM, workspaceName),
      );
    }
  };

  return (
    <Dialog
      canEscapeKeyClose
      canOutsideClickClose
      className="t--git-repo-limited-modal"
      isOpen={isOpen}
      maxWidth={"900px"}
      noModalBodyMarginTop
      onClose={onClose}
      width={"550px"}
    >
      <Container>
        <BodyContainer>
          <Text color={Colors.BLACK} type={TextType.H1} weight="bold">
            {createMessage(REPOSITORY_LIMIT_REACHED)}
          </Text>
          <Text
            color={Colors.BLACK}
            style={{ marginTop: theme.spaces[3], width: "410px" }}
            type={TextType.P1}
          >
            {createMessage(REPOSITORY_LIMIT_REACHED_INFO)}
          </Text>
          <InfoWrapper
            style={{
              margin: `${theme.spaces[7]}px 0px`,
              paddingTop: theme.spaces[6],
              paddingBottom: theme.spaces[6],
            }}
          >
            <Icon
              fillColor={Colors.YELLOW_LIGHT}
              name="warning-line"
              size={IconSize.XXXL}
            />
            <div style={{ display: "block" }}>
              <Text
                color={Colors.BROWN}
                style={{ marginRight: theme.spaces[2] }}
                type={TextType.P3}
              >
                {createMessage(CONTACT_SUPPORT_TO_UPGRADE)}
              </Text>
            </div>
          </InfoWrapper>
          <ButtonContainer>
            <Button
              category={Category.tertiary}
              className="t--contact-sales-button"
              onClick={() => {
                AnalyticsUtil.logEvent("GS_CONTACT_SALES_CLICK", {
                  source: "REPO_LIMIT_EXCEEDED_ERROR_MODAL",
                });
                openIntercom();
              }}
              size={Size.large}
              tag="button"
              text={createMessage(CONTACT_SUPPORT)}
            />
          </ButtonContainer>
          <div style={{ marginTop: theme.spaces[15] }}>
            <Text color={Colors.BLACK} type={TextType.H1}>
              {createMessage(DISCONNECT_EXISTING_REPOSITORIES)}
            </Text>
          </div>
          <div style={{ marginTop: theme.spaces[3], width: 410 }}>
            <Text color={Colors.BLACK} type={TextType.P1}>
              {createMessage(DISCONNECT_EXISTING_REPOSITORIES_INFO)}
            </Text>
          </div>
          <InfoWrapper isError style={{ margin: `${theme.spaces[7]}px 0px 0` }}>
            <Icon
              fillColor={Colors.CRIMSON}
              name="warning-line"
              size={IconSize.XXXL}
            />
            <div style={{ display: "block" }}>
              <Text
                color={Colors.CRIMSON}
                style={{ marginRight: theme.spaces[2] }}
                type={TextType.P3}
              >
                {createMessage(DISCONNECT_CAUSE_APPLICATION_BREAK)}
              </Text>
              <Link
                className="t--learn-more-repo-limit-modal"
                color={Colors.CRIMSON}
                link={docURL}
                text={createMessage(LEARN_MORE)}
              />
            </div>
          </InfoWrapper>
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
                      <Text color={Colors.OXFORD_BLUE} type={TextType.H4}>
                        {application.name}
                      </Text>
                    </TextWrapper>
                    <TextWrapper>
                      <Text color={Colors.OXFORD_BLUE} type={TextType.P3}>
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
        </BodyContainer>
        <CloseBtnContainer onClick={onClose}>
          <Icon
            fillColor={get(theme, "colors.gitSyncModal.closeIcon")}
            name="close-modal"
            size={IconSize.XXXXL}
          />
        </CloseBtnContainer>
      </Container>
    </Dialog>
  );
}

export default RepoLimitExceededErrorModal;
