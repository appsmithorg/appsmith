import React from "react";
import styled, { ThemeProvider } from "styled-components";
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
  getIsErroredSavingAppName,
  showAppInviteUsersDialogSelector,
} from "selectors/applicationSelectors";
import EditableAppName from "./EditableAppName";
import Boxed from "components/editorComponents/Onboarding/Boxed";
import OnboardingHelper from "components/editorComponents/Onboarding/Helper";
import { OnboardingStep } from "constants/OnboardingConstants";
import GlobalSearch from "components/editorComponents/GlobalSearch";
import EndOnboardingTour from "components/editorComponents/Onboarding/EndTour";
import ProfileDropdown from "pages/common/ProfileDropdown";
import { getCurrentUser } from "selectors/usersSelectors";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
import Button, { Size } from "components/ads/Button";
import { IconWrapper } from "components/ads/Icon";
import { Profile } from "pages/common/ProfileImage";
import { getTypographyByKey } from "constants/DefaultTheme";
import HelpBar from "components/editorComponents/GlobalSearch/HelpBar";
import HelpButton from "./HelpButton";
import OnboardingIndicator from "components/editorComponents/Onboarding/Indicator";
import { getThemeDetails, ThemeMode } from "selectors/themeSelectors";
import ToggleModeButton from "pages/Editor/ToggleModeButton";

const HeaderWrapper = styled(StyledHeader)`
  width: 100%;
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

// looks offset by 1px even though, checking bounding rect values
const HeaderSection = styled.div`
  position: relative;
  top: -1px;
  display: flex;
  flex: 1;
  overflow: visible;
  align-items: center;
  :nth-child(1) {
    justify-content: flex-start;
    max-width: 30%;
  }
  :nth-child(2) {
    justify-content: center;
  }
  :nth-child(3) {
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
  darkTheme: any;
};

export function EditorHeader(props: EditorHeaderProps) {
  const {
    applicationId,
    currentApplication,
    isPublishing,
    isSaving,
    orgId,
    pageId,
    pageSaveError,
    publishApplication,
  } = props;

  const dispatch = useDispatch();
  const isSavingName = useSelector(getIsSavingAppName);
  const isErroredSavingName = useSelector(getIsErroredSavingAppName);
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
          className="t--save-status-success"
          color={"#36AB80"}
          height={20}
          width={20}
        />
      );
    } else {
      saveStatusIcon = (
        <HeaderIcons.SAVE_FAILURE
          className={"t--save-status-error"}
          color={"#F69D2C"}
          height={20}
          width={20}
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

  const showAppInviteUsersDialog = useSelector(
    showAppInviteUsersDialogSelector,
  );

  return (
    <ThemeProvider theme={props.darkTheme}>
      <HeaderWrapper>
        <HeaderSection>
          <Link style={{ height: 24 }} to={APPLICATIONS_URL}>
            <AppsmithLogoImg
              alt="Appsmith logo"
              className="t--appsmith-logo"
              src={AppsmithLogo}
            />
          </Link>
          <Boxed step={OnboardingStep.FINISH}>
            {currentApplication && (
              <EditableAppName
                className="t--application-name editable-application-name"
                defaultValue={currentApplication.name || ""}
                editInteractionKind={EditInteractionKind.SINGLE}
                fill
                isError={isErroredSavingName}
                isNewApp={
                  applicationList.filter((el) => el.id === applicationId)
                    .length > 0
                }
                onBlur={(value: string) =>
                  updateApplicationDispatch(applicationId || "", {
                    name: value,
                    currentApp: true,
                  })
                }
                savingState={
                  isSavingName ? SavingState.STARTED : SavingState.NOT_STARTED
                }
              />
            )}
            <ToggleModeButton />
          </Boxed>
        </HeaderSection>
        <HeaderSection>
          <HelpBar />
          <HelpButton />
        </HeaderSection>
        <HeaderSection>
          <Boxed step={OnboardingStep.FINISH}>
            <SaveStatusContainer className={"t--save-status-container"}>
              {saveStatusIcon}
            </SaveStatusContainer>
            <FormDialogComponent
              Form={AppInviteUsersForm}
              applicationId={applicationId}
              canOutsideClickClose
              isOpen={showAppInviteUsersDialog}
              orgId={orgId}
              title={
                currentApplication
                  ? currentApplication.name
                  : "Share Application"
              }
              trigger={
                <Button
                  className="t--application-share-btn header__application-share-btn"
                  icon={"share"}
                  size={Size.small}
                  text={"Share"}
                />
              }
            />
          </Boxed>
          <Boxed
            alternative={<EndOnboardingTour />}
            step={OnboardingStep.DEPLOY}
          >
            <DeploySection>
              <OnboardingIndicator
                hasButton={false}
                step={OnboardingStep.DEPLOY}
                width={75}
              >
                <StyledDeployButton
                  className="t--application-publish-btn"
                  fill
                  isLoading={isPublishing}
                  onClick={handlePublish}
                  size={Size.small}
                  text={"Deploy"}
                />
              </OnboardingIndicator>

              <DeployLinkButtonDialog
                link={getApplicationViewerPageURL(applicationId, pageId)}
                trigger={
                  <StyledDeployButton icon={"downArrow"} size={Size.xxs} />
                }
              />
            </DeploySection>
          </Boxed>
          {user && user.username !== ANONYMOUS_USERNAME && (
            <ProfileDropdownContainer>
              <ProfileDropdown
                hideThemeSwitch
                name={user.name}
                userName={user?.username || ""}
              />
            </ProfileDropdownContainer>
          )}
        </HeaderSection>
        <OnboardingHelper />
        <GlobalSearch />
      </HeaderWrapper>
    </ThemeProvider>
  );
}

const mapStateToProps = (state: AppState) => ({
  pageName: state.ui.editor.currentPageName,
  isSaving: getIsPageSaving(state),
  pageSaveError: getPageSavingError(state),
  orgId: getCurrentOrgId(state),
  applicationId: getCurrentApplicationId(state),
  currentApplication: state.ui.applications.currentApplication,
  isPublishing: getIsPublishingApplication(state),
  pageId: getCurrentPageId(state),
  darkTheme: getThemeDetails(state, ThemeMode.DARK),
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
