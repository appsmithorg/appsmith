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
import { MENU_HEIGHT } from "./constants";
import Text, { TextType } from "components/ads/Text";
import { Colors } from "constants/Colors";
import {
  CONTACT_SUPPORT,
  CONTACT_SUPPORT_TO_UPGRADE,
  createMessage,
  DISCONNECT_CAUSE_APPLICATION_BREAK,
  DISCONNECT_GIT,
  LEARN_MORE,
  REPOSITORY_LIMIT_REACHED,
  REPOSITORY_LIMIT_REACHED_INFO,
  DISCONNECT_EXISTING_REPOSITORIES,
  DISCONNECT_EXISTING_REPOSITORIES_INFO,
  CONTACT_SALES_MESSAGE_ON_INTERCOM,
} from "@appsmith/constants/messages";
import Icon, { IconSize } from "components/ads/Icon";
import Link from "./components/Link";
import { get } from "lodash";
import { Theme } from "constants/DefaultTheme";
import {
  getCurrentApplication,
  getUserApplicationsOrgs,
} from "selectors/applicationSelectors";
import {
  ApplicationPayload,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import AnalyticsUtil from "utils/AnalyticsUtil";
import InfoWrapper from "./components/InfoWrapper";

const Container = styled.div`
  height: 600px;
  width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-y: hidden;
  padding: 0px ${(props) => props.theme.spaces[4]}px;
`;

const BodyContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100% - ${MENU_HEIGHT}px);
`;

const CloseBtnContainer = styled.div`
  position: absolute;
  right: ${(props) => props.theme.spaces[1]}px;
  top: 0px;

  padding: ${(props) => props.theme.spaces[1]}px;
  border-radius: ${(props) => props.theme.radii[1]}px;
`;

const ButtonContainer = styled.div`
  margin-top: ${(props) => `${props.theme.spaces[7]}px`};
`;

const ApplicationWrapper = styled.div`
  margin-top: ${(props) => props.theme.spaces[8]}px;
  display: flex;
  justify-content: space-between;
`;

const TextWrapper = styled.div`
  display: block;
`;

function RepoLimitExceededErrorModal() {
  const isOpen = useSelector(getShowRepoLimitErrorModal);
  const dispatch = useDispatch();
  const application = useSelector(getCurrentApplication);
  const userOrgs = useSelector(getUserApplicationsOrgs);
  const docURL = useSelector(getDisconnectDocUrl);
  const [orgName, setOrgName] = useState("");
  const applications = useMemo(() => {
    if (userOrgs) {
      const org: any = userOrgs.find((organizationObject: any) => {
        const { organization } = organizationObject;
        return organization.id === application?.organizationId;
      });
      setOrgName(org?.organization.name || "");
      return (
        org?.applications.filter((application: ApplicationPayload) => {
          return (
            application.gitApplicationMetadata &&
            application.gitApplicationMetadata.remoteUrl &&
            application.gitApplicationMetadata.branchName &&
            application.gitApplicationMetadata.repoName &&
            application.gitApplicationMetadata.isRepoPrivate
          );
        }) || []
      );
    } else {
      return [];
    }
  }, [userOrgs]);
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
        createMessage(CONTACT_SALES_MESSAGE_ON_INTERCOM, orgName),
      );
    }
  };

  return (
    <Dialog
      canEscapeKeyClose
      canOutsideClickClose
      className="t--git-repo-limited-modal"
      isOpen={!!isOpen}
      maxWidth={"900px"}
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
            style={{ marginTop: theme.spaces[3] }}
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
              name="info"
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
          <Text
            color={Colors.BLACK}
            style={{ marginTop: theme.spaces[17] }}
            type={TextType.H1}
          >
            {createMessage(DISCONNECT_EXISTING_REPOSITORIES)}
          </Text>
          <Text
            color={Colors.BLACK}
            style={{ marginTop: theme.spaces[3], width: 410 }}
            type={TextType.P1}
          >
            {createMessage(DISCONNECT_EXISTING_REPOSITORIES_INFO)}
          </Text>
          <InfoWrapper isError style={{ margin: `${theme.spaces[7]}px 0px` }}>
            <Icon fillColor={Colors.CRIMSON} name="info" size={IconSize.XXXL} />
            <div style={{ display: "block" }}>
              <Text
                color={Colors.CRIMSON}
                style={{ marginRight: theme.spaces[2] }}
                type={TextType.P3}
              >
                {createMessage(DISCONNECT_CAUSE_APPLICATION_BREAK)}
              </Text>
              <Link
                color={Colors.CRIMSON}
                link={docURL}
                text={createMessage(LEARN_MORE)}
              />
            </div>
          </InfoWrapper>
          {applications.map((application: ApplicationPayload) => {
            const { gitApplicationMetadata } = application;
            return (
              <ApplicationWrapper key={application.id}>
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
                  color={Colors.CRIMSON}
                  hasIcon
                  link=""
                  onClick={() =>
                    openDisconnectGitModal(application.id, application.name)
                  }
                  text={createMessage(DISCONNECT_GIT)}
                />
              </ApplicationWrapper>
            );
          })}
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
