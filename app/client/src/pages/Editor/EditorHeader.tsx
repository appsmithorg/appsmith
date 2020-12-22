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
import AppInviteUsersForm from "pages/organization/AppInviteUsersForm";
import Button from "components/editorComponents/Button";
import StyledHeader from "components/designSystems/appsmith/StyledHeader";
import AnalyticsUtil from "utils/AnalyticsUtil";
import HelpModal from "components/designSystems/appsmith/help/HelpModal";
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
import { connect, useDispatch, useSelector } from "react-redux";
import { HeaderIcons } from "icons/HeaderIcons";
import ThreeDotLoading from "components/designSystems/appsmith/header/ThreeDotsLoading";
import DeployLinkButtonDialog from "components/designSystems/appsmith/header/DeployLinkButton";
import { EditInteractionKind, SavingState } from "components/ads/EditableText";
import { updateApplication } from "actions/applicationActions";
import {
  getApplicationList,
  getIsSavingAppName,
} from "selectors/applicationSelectors";
import EditableTextWrapper from "components/ads/EditableTextWrapper";
import Boxed from "components/editorComponents/Onboarding/Boxed";
import OnboardingToolTip from "components/editorComponents/Onboarding/Tooltip";
import { Position } from "@blueprintjs/core";
import { inOnboarding } from "sagas/OnboardingSagas";
import { OnboardingStep } from "constants/OnboardingConstants";

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

const SaveStatusContainer = styled.div`
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
  pageSaveError?: boolean;
  pageName?: string;
  pageId?: string;
  isPublishing: boolean;
  publishedTime?: string;
  orgId: string;
  applicationId?: string;
  currentApplication?: ApplicationPayload;
  isSaving: boolean;
  isInOnboarding: boolean;
  publishApplication: (appId: string) => void;
};

export const EditorHeader = (props: EditorHeaderProps) => {
  const {
    currentApplication,
    isSaving,
    pageSaveError,
    pageId,
    isPublishing,
    orgId,
    applicationId,
    pageName,
    publishApplication,
    isInOnboarding,
  } = props;

  const dispatch = useDispatch();
  const isSavingName = useSelector(getIsSavingAppName);
  const applicationList = useSelector(getApplicationList);

  const handlePublish = () => {
    if (applicationId) {
      publishApplication(applicationId);

      const appName = currentApplication ? currentApplication.name : "";
      AnalyticsUtil.logEvent("PUBLISH_APP", {
        appId: applicationId,
        appName,
      });
    }
  };

  let saveStatusIcon: React.ReactNode;
  if (isSaving) {
    saveStatusIcon = <ThreeDotLoading className="t--save-status-is-saving" />;
  } else {
    if (!pageSaveError) {
      saveStatusIcon = (
        <HeaderIcons.SAVE_SUCCESS
          color={"#36AB80"}
          height={20}
          width={20}
          className="t--save-status-success"
        />
      );
    } else {
      saveStatusIcon = (
        <HeaderIcons.SAVE_FAILURE
          color={"#F69D2C"}
          height={20}
          width={20}
          className={"t--save-status-error"}
        />
      );
    }
  }

  const updateApplicationDispatch = (
    id: string,
    data: { name: string; currentApp: boolean },
  ) => {
    dispatch(updateApplication(id, data));
  };

  return (
    <HeaderWrapper>
      <HeaderSection>
        <Link to={APPLICATIONS_URL}>
          <AppsmithLogoImg
            src={AppsmithLogo}
            alt="Appsmith logo"
            className="t--appsmith-logo"
          />
        </Link>
      </HeaderSection>
      <Boxed step={OnboardingStep.DEPLOY}>
        <HeaderSection flex-direction={"row"}>
          {currentApplication ? (
            <EditableTextWrapper
              variant="UNDERLINE"
              defaultValue={currentApplication.name || ""}
              editInteractionKind={EditInteractionKind.SINGLE}
              hideEditIcon={true}
              className="t--application-name"
              fill={false}
              savingState={
                isSavingName ? SavingState.STARTED : SavingState.NOT_STARTED
              }
              isNewApp={
                !isInOnboarding &&
                applicationList.filter(el => el.id === applicationId).length > 0
              }
              onBlur={(value: string) =>
                updateApplicationDispatch(applicationId || "", {
                  name: value,
                  currentApp: true,
                })
              }
            />
          ) : null}
          {/* <PageName>{pageName}&nbsp;</PageName> */}
        </HeaderSection>
        <HeaderSection>
          <SaveStatusContainer className={"t--save-status-container"}>
            {saveStatusIcon}
          </SaveStatusContainer>
          <ShareButton
            target="_blank"
            href="https://mail.google.com/mail/u/0/?view=cm&fs=1&to=feedback@appsmith.com&tf=1"
            text="Feedback"
            intent="none"
            outline
            size="small"
            className="t--application-feedback-btn"
            icon={
              <HeaderIcons.FEEDBACK
                color={Colors.WHITE}
                width={13}
                height={13}
              />
            }
          />
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
            canOutsideClickClose={true}
            Form={AppInviteUsersForm}
            orgId={orgId}
            applicationId={applicationId}
            title={
              currentApplication ? currentApplication.name : "Share Application"
            }
          />
          <DeploySection>
            <OnboardingToolTip
              step={[OnboardingStep.DEPLOY]}
              position={Position.BOTTOM_RIGHT}
            >
              <DeployButton
                onClick={handlePublish}
                text="Deploy"
                loading={isPublishing}
                intent="primary"
                filled
                size="small"
                className="t--application-publish-btn"
                icon={
                  <HeaderIcons.DEPLOY
                    color={Colors.WHITE}
                    width={13}
                    height={13}
                  />
                }
              />
            </OnboardingToolTip>
            <DeployLinkButtonDialog
              trigger={
                <DeployLinkButton icon="caret-down" filled intent="primary" />
              }
              link={getApplicationViewerPageURL(applicationId, pageId)}
            />
          </DeploySection>
        </HeaderSection>
      </Boxed>
      <HelpModal page={"Editor"} />
    </HeaderWrapper>
  );
};

const mapStateToProps = (state: AppState) => ({
  pageName: state.ui.editor.currentPageName,
  isSaving: getIsPageSaving(state),
  orgId: getCurrentOrgId(state),
  applicationId: getCurrentApplicationId(state),
  currentApplication: state.ui.applications.currentApplication,
  isPublishing: getIsPublishingApplication(state),
  pageId: getCurrentPageId(state),
  isInOnboarding: inOnboarding(state),
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
