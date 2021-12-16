import React, { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Dialog from "components/ads/DialogComponent";
import { getShowRepoLimitErrorModal } from "selectors/gitSyncSelectors";
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
  CONTACT_SALES,
  createMessage,
  REPOSITORY_LIMIT_REACHED,
  REPOSITORY_LIMIT_REACHED_INFO,
  REVOKE_ACCESS,
  REVOKE_EXISTING_REPOSITORIES,
  REVOKE_EXISTING_REPOSITORIES_INFO,
} from "constants/messages";
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
  const applications = useMemo(() => {
    if (userOrgs) {
      const org: any = userOrgs.find((organizationObject: any) => {
        const { organization } = organizationObject;
        return organization.id === application?.organizationId;
      });
      return (
        org?.applications.filter((application: ApplicationPayload) => {
          return (
            application.gitApplicationMetadata &&
            application.gitApplicationMetadata.remoteUrl &&
            application.gitApplicationMetadata.branchName &&
            application.gitApplicationMetadata.repoName
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
          <ButtonContainer>
            <Button
              category={Category.tertiary}
              className="t--contact-sales-button"
              size={Size.large}
              tag="button"
              text={createMessage(CONTACT_SALES)}
            />
          </ButtonContainer>
          <Text
            color={Colors.BLACK}
            style={{ marginTop: theme.spaces[17] + 20 }}
            type={TextType.H1}
          >
            {createMessage(REVOKE_EXISTING_REPOSITORIES)}
          </Text>
          <Text
            color={Colors.BLACK}
            style={{ marginTop: theme.spaces[3], width: 410 }}
            type={TextType.P1}
          >
            {createMessage(REVOKE_EXISTING_REPOSITORIES_INFO)}
          </Text>
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
                  text={createMessage(REVOKE_ACCESS)}
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
