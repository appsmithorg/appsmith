import React from "react";
import styled from "styled-components";
import {
  ApplicationPayload,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import {
  APPLICATIONS_URL,
  getApplicationViewerPageURL,
} from "constants/routes";
import {
  PERMISSION_TYPE,
  isPermitted,
} from "pages/Applications/permissionHelpers";
import InviteUsersFormv2 from "pages/organization/InviteUsersFromv2";
import { PageListPayload } from "constants/ReduxActionConstants";
import Button from "components/editorComponents/Button";
import StyledHeader from "components/designSystems/appsmith/StyledHeader";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { HelpModal } from "components/designSystems/appsmith/help/HelpModal";
import { FormDialogComponent } from "components/editorComponents/form/FormDialogComponent";
import { Colors } from "constants/Colors";
import AppsmithLogo from "assets/images/appsmith_logo_white.png";
import { Link } from "react-router-dom";
import { AppState } from "reducers";
import {
  getCurrentApplicationId,
  getCurrentPageId,
  getIsPageSaving,
  getIsPublishingApplication,
} from "selectors/editorSelectors";
import { getCurrentOrgId } from "selectors/organizationSelectors";
import { connect } from "react-redux";
import { HeaderIcons } from "icons/HeaderIcons";
import ThreeDotLoading from "components/designSystems/appsmith/header/ThreeDotsLoading";
import DeployLinkButtonDialog from "components/designSystems/appsmith/header/DeployLinkButton";

const HeaderWrapper = styled(StyledHeader)`
  background: ${Colors.BALTIC_SEA};
  height: 48px;
  color: white;
  flex-direction: row;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.05);
`;

const HeaderSection = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  :nth-child(1) {
    justify-content: flex-start;
  }
  :nth-child(2) {
    justify-content: center;
    flex-direction: column;
  }
  :nth-child(3) {
    justify-content: flex-end;
  }
`;

const AppsmithLogoImg = styled.img`
  max-width: 110px;
`;

const ApplicationName = styled.span`
  font-weight: 500;
  font-size: 14px;
  line-height: 14px;
  color: #fff;
  margin-bottom: 6px;
`;

const PageName = styled.span`
  display: flex;
  flex: 1;
  font-size: 12px;
  line-height: 12px;
  letter-spacing: 0.04em;
  color: #ffffff;
  opacity: 0.5;
`;

const LoadingContainer = styled.div`
  margin: 0 10px;
  border: 1px solid rgb(95, 105, 116);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
`;
const DeploySection = styled.div`
  display: flex;
`;

const DeployButton = styled(Button)`
  height: 32px;
  margin: 5px 10px;
  margin-right: 0;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
`;

const DeployLinkButton = styled(Button)`
  height: 32px;
  margin: 5px 10px;
  margin-left: 0;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  min-width: 20px !important;
  width: 20px !important;
  background-color: rgb(42, 195, 157) !important;
  border: none !important;
`;

const ShareButton = styled(Button)`
  height: 32px;
  margin: 5px 10px;
  color: white !important;
  border-color: rgb(95, 105, 116) !important;
`;

type EditorHeaderProps = {
  currentApplication?: ApplicationPayload;
  isSaving?: boolean;
  pageSaveError?: boolean;
  currentPageName?: string;
  onPublish: () => void;
  onCreatePage: (name: string) => void;
  pages?: PageListPayload;
  currentPageId?: string;
  isPublishing: boolean;
  publishedTime?: string;
  orgId: string;
  currentApplicationId?: string;
  createModal: () => void;
  publishApplication: (appId: string) => void;
};

export const EditorHeader = (props: EditorHeaderProps) => {
  const {
    currentApplication,
    isSaving,
    pageSaveError,
    currentPageId,
    isPublishing,
    orgId,
    currentApplicationId,
    currentPageName,
    publishApplication,
  } = props;

  const handlePublish = () => {
    if (currentApplicationId) {
      publishApplication(currentApplicationId);

      const appName = currentApplication ? currentApplication.name : "";
      AnalyticsUtil.logEvent("PUBLISH_APP", {
        appId: currentApplicationId,
        appName: appName,
      });
    }
  };

  let saveStatusMessage: React.ReactNode = "";
  if (isSaving) {
    saveStatusMessage = <ThreeDotLoading />;
  }
  if (!isSaving) {
    if (!pageSaveError) {
      saveStatusMessage = (
        <HeaderIcons.SAVE_SUCCESS color={"#36AB80"} height={20} width={20} />
      );
    } else {
      saveStatusMessage = (
        <HeaderIcons.SAVE_FAILURE color={"#F69D2C"} height={20} width={20} />
      );
    }
  }
  const applicationPermissions = currentApplication?.userPermissions
    ? currentApplication.userPermissions
    : [];

  return (
    <HeaderWrapper>
      <HeaderSection>
        <Link to={APPLICATIONS_URL}>
          <AppsmithLogoImg src={AppsmithLogo} alt="Appsmith logo" />
        </Link>
      </HeaderSection>
      <HeaderSection flex-direction={"row"}>
        <ApplicationName>{currentApplication?.name}&nbsp;</ApplicationName>
        <PageName>{currentPageName}&nbsp;</PageName>
      </HeaderSection>
      <HeaderSection>
        <LoadingContainer>{saveStatusMessage}</LoadingContainer>
        <ShareButton
          text="Feedback"
          intent="none"
          outline
          size="small"
          className="t--application-feedback-btn"
          icon={
            <HeaderIcons.FEEDBACK color={Colors.WHITE} width={13} height={13} />
          }
        />
        {isPermitted(
          applicationPermissions,
          PERMISSION_TYPE.MANAGE_APPLICATION,
        ) && (
          <FormDialogComponent
            trigger={
              <ShareButton
                text="Share"
                intent="none"
                outline
                size="small"
                className="t--application-share-btn"
                icon={
                  <HeaderIcons.SHARE
                    color={Colors.WHITE}
                    width={13}
                    height={13}
                  />
                }
              />
            }
            Form={InviteUsersFormv2}
            orgId={orgId}
            applicationId={currentApplicationId}
            title={
              currentApplication ? currentApplication.name : "Share Application"
            }
          />
        )}
        <DeploySection>
          <DeployButton
            onClick={handlePublish}
            text="Deploy"
            loading={isPublishing}
            intent="primary"
            filled
            size="small"
            className="t--application-publish-btn"
            icon={
              <HeaderIcons.DEPLOY color={Colors.WHITE} width={13} height={13} />
            }
          />
          <DeployLinkButtonDialog
            trigger={
              <DeployLinkButton icon="caret-down" filled intent="primary" />
            }
            link={getApplicationViewerPageURL(
              currentApplicationId,
              currentPageId,
            )}
          />
        </DeploySection>
      </HeaderSection>
      {}
      <HelpModal />
    </HeaderWrapper>
  );
};

const mapStateToProps = (state: AppState) => ({
  currentPageName: state.ui.editor.currentPageName,
  isSaving: getIsPageSaving(state),
  currentOrgId: getCurrentOrgId(state),
  currentApplicationId: getCurrentApplicationId(state),
  currentApplication: state.ui.applications.currentApplication,
  isPublishing: getIsPublishingApplication(state),
  currentPageId: getCurrentPageId(state),
});

const mapDispatchToProps = (dispatch: any) => ({
  publishApplication: (applicationId: string) => {
    dispatch({
      type: ReduxActionTypes.PUBLISH_APPLICATION_INIT,
      payload: {
        applicationId,
      },
    });
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(EditorHeader);
