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
import StyledHeader from "components/designSystems/appsmith/StyledHeader";
import AnalyticsUtil from "utils/AnalyticsUtil";
import HelpModal from "components/designSystems/appsmith/help/HelpModal";
import { FormDialogComponent } from "components/editorComponents/form/FormDialogComponent";
import AppsmithLogo from "assets/images/appsmith_logo_square.png";
import { Link } from "react-router-dom";
import { AppState } from "reducers";
import {
  getCurrentApplicationId,
  getCurrentPageId,
  getIsPageSaving,
  getIsPublishingApplication,
  getPageSavingError,
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
import EditableAppName from "./EditableAppName";
import Boxed from "components/editorComponents/Onboarding/Boxed";
import OnboardingToolTip from "components/editorComponents/Onboarding/Tooltip";
import { OnboardingStep } from "constants/OnboardingConstants";
import { Position } from "@blueprintjs/core";
import Indicator from "components/editorComponents/Onboarding/Indicator";
import ProfileDropdown from "pages/common/ProfileDropdown";
import { getCurrentUser } from "selectors/usersSelectors";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
import Button, { Size } from "components/ads/Button";
import { IconWrapper } from "components/ads/Icon";
import { Profile } from "pages/common/ProfileImage";
import { getTypographyByKey } from "constants/DefaultTheme";

const HeaderWrapper = styled(StyledHeader)`
  padding-right: 0;
  padding-left: ${(props) => props.theme.spaces[7]}px;
  background-color: ${(props) => props.theme.colors.header.background};
  height: ${(props) => props.theme.smallHeaderHeight};
  flex-direction: row;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.05);
  & .editable-application-name {
    ${(props) => getTypographyByKey(props, "h4")}
    color: ${(props) => props.theme.colors.header.appName};
  }

  & .header__application-share-btn {
    background-color: ${(props) => props.theme.colors.header.background};
    border-color: ${(props) => props.theme.colors.header.background};
    // margin-right: ${(props) => props.theme.spaces[1]}px;
  }

  & .header__application-share-btn:hover {
    color: ${(props) => props.theme.colors.header.shareBtnHighlight};
    ${IconWrapper} path {
      fill: ${(props) => props.theme.colors.header.shareBtnHighlight};
    }
  }

  & ${Profile} {
    width: 24px;
    height: 24px;
  }
`;

const HeaderSection = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  :nth-child(1) {
    justify-content: flex-start;
  }
  :nth-child(2) {
    justify-content: flex-end;
  }
`;

const AppsmithLogoImg = styled.img`
  margin-right: ${(props) => props.theme.spaces[6]}px;
  height: 24px;
`;

const SaveStatusContainer = styled.div`
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

const ProfileDropdownContainer = styled.div`
  margin: 0 ${(props) => props.theme.spaces[7]}px;
`;

const StyledDeployButton = styled(Button)`
  height: ${(props) => props.theme.smallHeaderHeight};
  ${(props) => getTypographyByKey(props, "btnLarge")}
  padding: ${(props) => props.theme.spaces[2]}px;
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
  publishApplication: (appId: string) => void;
};

export const EditorHeader = (props: EditorHeaderProps) => {
  const {
    currentApplication,
    isSaving,
    pageSaveError,
    pageId,
    orgId,
    applicationId,
    publishApplication,
  } = props;

  const dispatch = useDispatch();
  const isSavingName = useSelector(getIsSavingAppName);
  const applicationList = useSelector(getApplicationList);
  const user = useSelector(getCurrentUser);

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
        <Link to={APPLICATIONS_URL} style={{ height: 24 }}>
          <AppsmithLogoImg
            src={AppsmithLogo}
            alt="Appsmith logo"
            className="t--appsmith-logo"
          />
        </Link>
        <Boxed step={OnboardingStep.FINISH}>
          {currentApplication && (
            <EditableAppName
              defaultValue={currentApplication.name || ""}
              editInteractionKind={EditInteractionKind.SINGLE}
              className="t--application-name editable-application-name"
              fill={false}
              savingState={
                isSavingName ? SavingState.STARTED : SavingState.NOT_STARTED
              }
              isNewApp={
                applicationList.filter((el) => el.id === applicationId).length >
                0
              }
              onBlur={(value: string) =>
                updateApplicationDispatch(applicationId || "", {
                  name: value,
                  currentApp: true,
                })
              }
            />
          )}
        </Boxed>
      </HeaderSection>
      <HeaderSection>
        <Boxed step={OnboardingStep.FINISH}>
          <SaveStatusContainer className={"t--save-status-container"}>
            {saveStatusIcon}
          </SaveStatusContainer>
          <FormDialogComponent
            trigger={
              <Button
                text={"Share"}
                icon={"share"}
                size={Size.small}
                className="t--application-share-btn header__application-share-btn"
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
        </Boxed>
        <Boxed step={OnboardingStep.SUCCESSFUL_BINDING}>
          <DeploySection>
            <OnboardingToolTip
              step={[OnboardingStep.DEPLOY]}
              position={Position.BOTTOM_RIGHT}
              dismissOnOutsideClick={false}
            >
              <Indicator
                step={OnboardingStep.SUCCESSFUL_BINDING}
                offset={{ left: 10 }}
                theme={"light"}
              >
                <StyledDeployButton
                  fill
                  onClick={handlePublish}
                  text={"Deploy"}
                  size={Size.small}
                  className="t--application-publish-btn"
                />
              </Indicator>
            </OnboardingToolTip>
            <DeployLinkButtonDialog
              trigger={
                <StyledDeployButton icon={"downArrow"} size={Size.xxs} />
              }
              link={getApplicationViewerPageURL(applicationId, pageId)}
            />
          </DeploySection>
        </Boxed>
        {user && user.username !== ANONYMOUS_USERNAME && (
          <ProfileDropdownContainer>
            <ProfileDropdown userName={user?.username || ""} hideThemeSwitch />
          </ProfileDropdownContainer>
        )}
      </HeaderSection>
      <HelpModal page={"Editor"} />
    </HeaderWrapper>
  );
};

const mapStateToProps = (state: AppState) => ({
  pageName: state.ui.editor.currentPageName,
  isSaving: getIsPageSaving(state),
  pageSaveError: getPageSavingError(state),
  orgId: getCurrentOrgId(state),
  applicationId: getCurrentApplicationId(state),
  currentApplication: state.ui.applications.currentApplication,
  isPublishing: getIsPublishingApplication(state),
  pageId: getCurrentPageId(state),
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
