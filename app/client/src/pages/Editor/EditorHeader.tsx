import React, { useCallback, useEffect, useState, lazy, Suspense } from "react";
import styled, { ThemeProvider } from "styled-components";
import classNames from "classnames";
import { Classes as Popover2Classes } from "@blueprintjs/popover2";
import {
  CurrentApplicationData,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import {
  APPLICATIONS_URL,
  getApplicationViewerPageURL,
} from "constants/routes";
import AppInviteUsersForm from "pages/organization/AppInviteUsersForm";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { FormDialogComponent } from "components/editorComponents/form/FormDialogComponent";
import AppsmithLogo from "assets/images/appsmith_logo_square.png";
import { Link } from "react-router-dom";
import { AppState } from "reducers";
import {
  getCurrentApplicationId,
  getCurrentPageId,
  getIsPublishingApplication,
  previewModeSelector,
} from "selectors/editorSelectors";
import { getAllUsers, getCurrentOrgId } from "selectors/organizationSelectors";
import { connect, useDispatch, useSelector } from "react-redux";
import DeployLinkButtonDialog from "components/designSystems/appsmith/header/DeployLinkButton";
import { EditInteractionKind, SavingState } from "components/ads/EditableText";
import { updateApplication } from "actions/applicationActions";
import {
  getApplicationList,
  getIsSavingAppName,
  getIsErroredSavingAppName,
  showAppInviteUsersDialogSelector,
} from "selectors/applicationSelectors";
import EditorAppName from "./EditorAppName";
import ProfileDropdown from "pages/common/ProfileDropdown";
import { getCurrentUser } from "selectors/usersSelectors";
import { ANONYMOUS_USERNAME, User } from "constants/userConstants";
import Button, { Size } from "components/ads/Button";
import Icon, { IconSize } from "components/ads/Icon";
import { Profile } from "pages/common/ProfileImage";
import { getTypographyByKey } from "constants/DefaultTheme";
import HelpBar from "components/editorComponents/GlobalSearch/HelpBar";
import HelpButton from "./HelpButton";
import { getTheme, ThemeMode } from "selectors/themeSelectors";
import ToggleModeButton, {
  useHideComments,
} from "pages/Editor/ToggleModeButton";
import { Colors } from "constants/Colors";
import { snipingModeSelector } from "selectors/editorSelectors";
import { setSnipingMode as setSnipingModeAction } from "actions/propertyPaneActions";
import { useLocation } from "react-router";
import { showConnectGitModal } from "actions/gitSyncActions";
import RealtimeAppEditors from "./RealtimeAppEditors";
import { EditorSaveIndicator } from "./EditorSaveIndicator";
import getFeatureFlags from "utils/featureFlags";

import { retryPromise } from "utils/AppsmithUtils";
import { fetchUsersForOrg } from "actions/orgActions";
import { OrgUser } from "constants/orgConstants";

import { getIsGitConnected } from "../../selectors/gitSyncSelectors";
import TooltipComponent from "components/ads/Tooltip";
import { Position } from "@blueprintjs/core/lib/esnext/common";
import {
  CLOSE_ENTITY_EXPLORER_MESSAGE,
  createMessage,
  DEPLOY_BUTTON_TOOLTIP,
  LOCK_ENTITY_EXPLORER_MESSAGE,
  LOGO_TOOLTIP,
  RENAME_APPLICATION_TOOLTIP,
  SHARE_BUTTON_TOOLTIP,
  SHARE_BUTTON_TOOLTIP_WITH_USER,
} from "@appsmith/constants/messages";
import { TOOLTIP_HOVER_ON_DELAY } from "constants/AppConstants";
import { ReactComponent as MenuIcon } from "assets/icons/header/hamburger.svg";
import { getExplorerPinned } from "selectors/explorerSelector";
import {
  setExplorerActiveAction,
  setExplorerPinnedAction,
} from "actions/explorerActions";
import { ReactComponent as UnpinIcon } from "assets/icons/ads/double-arrow-right.svg";
import { ReactComponent as PinIcon } from "assets/icons/ads/double-arrow-left.svg";
import { isMac } from "utils/helpers";
import Boxed from "./GuidedTour/Boxed";
import EndTour from "./GuidedTour/EndTour";
import { GUIDED_TOUR_STEPS } from "./GuidedTour/constants";

const HeaderWrapper = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  background-color: ${(props) => props.theme.colors.header.background};
  height: ${(props) => props.theme.smallHeaderHeight};
  flex-direction: row;
  box-shadow: none;
  border-bottom: 1px solid ${(props) => props.theme.colors.menuBorder};
  & .editable-application-name {
    ${(props) => getTypographyByKey(props, "h4")}
    color: ${(props) => props.theme.colors.header.appName};
  }
  & ${Profile} {
    width: 24px;
    height: 24px;
  }
`;

const HeaderSection = styled.div`
  position: relative;
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
  > .${Popover2Classes.POPOVER2_TARGET} {
    max-width: calc(100% - 50px);
    min-width: 100px;
  }
`;

const AppsmithLink = styled((props) => {
  // we are removing non input related props before passing them in the components
  // eslint-disable @typescript-eslint/no-unused-vars
  return <Link {...props} />;
})`
  height: 20px;
  width: 20px;
  display: inline-block;
  img {
    width: 20px;
    height: 20px;
  }
`;

const DeploySection = styled.div`
  display: flex;
`;

const ProfileDropdownContainer = styled.div``;

const StyledInviteButton = styled(Button)`
  margin-right: ${(props) => props.theme.spaces[9]}px;
  height: ${(props) => props.theme.smallHeaderHeight};
  ${(props) => getTypographyByKey(props, "btnLarge")}
  padding: ${(props) => props.theme.spaces[2]}px;
`;

const StyledDeployButton = styled(StyledInviteButton)`
  margin-right: 0px;
  height: 20px;
`;

const BindingBanner = styled.div`
  position: fixed;
  width: 199px;
  height: 36px;
  left: 50%;
  top: ${(props) => props.theme.smallHeaderHeight};
  transform: translate(-50%, 0);
  text-align: center;
  background: ${Colors.DANUBE};
  color: ${Colors.WHITE};
  font-weight: 500;
  font-size: 15px;
  line-height: 20px;
  /* Depth: 01 */
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0px 5px 20px rgba(0, 0, 0, 0.1);
  z-index: 9999;
`;

const StyledDeployIcon = styled(Icon)`
  height: 20px;
  width: 20px;
  align-self: center;
  background: ${(props) => props.theme.colors.header.shareBtnHighlight};
  &:hover {
    background: rgb(191, 65, 9);
  }
`;

const ShareButton = styled.div`
  cursor: pointer;
`;

const StyledShareText = styled.span`
  font-size: 12px;
  font-weight: 600;
  margin-left: 4px;
`;

const StyledSharedIcon = styled(Icon)`
  display: inline-block;
`;

const HamburgerContainer = styled.div`
  height: 34px;
  width: 34px;

  :hover {
    background-color: ${Colors.GEYSER_LIGHT};
  }
`;

type EditorHeaderProps = {
  pageSaveError?: boolean;
  pageName?: string;
  pageId?: string;
  isPublishing: boolean;
  publishedTime?: string;
  orgId: string;
  applicationId?: string;
  currentApplication?: CurrentApplicationData;
  isSaving: boolean;
  publishApplication: (appId: string) => void;
  lastUpdatedTime?: number;
  inOnboarding: boolean;
  sharedUserList: OrgUser[];
  currentUser?: User;
};

const GlobalSearch = lazy(() => {
  return retryPromise(() => import("components/editorComponents/GlobalSearch"));
});

export function ShareButtonComponent() {
  return (
    <ShareButton className="flex items-center t--application-share-btn header__application-share-btn">
      <StyledSharedIcon name="share-line" />
      <StyledShareText>SHARE</StyledShareText>
    </ShareButton>
  );
}

export function EditorHeader(props: EditorHeaderProps) {
  const {
    applicationId,
    currentApplication,
    isPublishing,
    orgId,
    pageId,
    publishApplication,
  } = props;
  const location = useLocation();
  const dispatch = useDispatch();
  const isSnipingMode = useSelector(snipingModeSelector);
  const isSavingName = useSelector(getIsSavingAppName);
  const pinned = useSelector(getExplorerPinned);
  const isGitConnected = useSelector(getIsGitConnected);
  const isErroredSavingName = useSelector(getIsErroredSavingAppName);
  const applicationList = useSelector(getApplicationList);
  const user = useSelector(getCurrentUser);
  const shouldHideComments = useHideComments();
  const isPreviewMode = useSelector(previewModeSelector);

  useEffect(() => {
    if (window.location.href) {
      const searchParams = new URL(window.location.href).searchParams;
      const isSnipingMode = searchParams.get("isSnipingMode");
      const updatedIsSnipingMode = isSnipingMode === "true";
      dispatch(setSnipingModeAction(updatedIsSnipingMode));
    }
  }, [location]);

  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);

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

  const updateApplicationDispatch = (
    id: string,
    data: { name: string; currentApp: boolean },
  ) => {
    dispatch(updateApplication(id, data));
  };

  const showAppInviteUsersDialog = useSelector(
    showAppInviteUsersDialogSelector,
  );

  const handleClickDeploy = useCallback(
    (fromDeploy?: boolean) => {
      if (getFeatureFlags().GIT && isGitConnected) {
        dispatch(showConnectGitModal());
        AnalyticsUtil.logEvent("GS_DEPLOY_GIT_CLICK", {
          source: fromDeploy
            ? "Deploy button"
            : "Application name menu (top left)",
        });
      } else {
        handlePublish();
      }
    },
    [getFeatureFlags().GIT, dispatch, handlePublish],
  );

  /**
   * on hovering the menu, make the explorer active
   */
  const onMenuHover = useCallback(() => {
    dispatch(setExplorerActiveAction(true));
  }, [setExplorerActiveAction]);

  /**
   * toggles the pinned state of sidebar
   */
  const onPin = useCallback(() => {
    dispatch(setExplorerPinnedAction(!pinned));
  }, [pinned, dispatch, setExplorerPinnedAction]);

  //Fetch all users for the application to show the share button tooltip
  useEffect(() => {
    if (orgId) {
      dispatch(fetchUsersForOrg(orgId));
    }
  }, [orgId]);
  const filteredSharedUserList = props.sharedUserList.filter(
    (user) => user.username !== props.currentUser?.username,
  );

  return (
    <ThemeProvider theme={theme}>
      <HeaderWrapper className="pr-3">
        <HeaderSection className="space-x-3">
          <HamburgerContainer className="text-gray-800 transform transition-all duration-400 relative p-0 flex items-center justify-center">
            <TooltipComponent
              content={
                <div className="flex justify-between items-center">
                  <span>
                    {!pinned
                      ? createMessage(LOCK_ENTITY_EXPLORER_MESSAGE)
                      : createMessage(CLOSE_ENTITY_EXPLORER_MESSAGE)}
                  </span>
                  <span className="ml-4 text-xs text-gray-300">
                    {isMac() ? "Cmd" : "Ctrl"} + /
                  </span>
                </div>
              }
              position="bottom-left"
            >
              <div
                className="relative w-4 h-4 text-trueGray-600 group t--pin-entity-explorer"
                onMouseEnter={onMenuHover}
              >
                <MenuIcon className="absolute w-4 h-4 transition-opacity fill-current cursor-pointer group-hover:opacity-0" />
                {!pinned && (
                  <UnpinIcon
                    className="absolute w-4 h-4 transition-opacity opacity-0 cursor-pointer fill-current group-hover:opacity-100"
                    onClick={onPin}
                  />
                )}
                {pinned && (
                  <PinIcon
                    className="absolute w-4 h-4 transition-opacity opacity-0 cursor-pointer fill-current group-hover:opacity-100"
                    onClick={onPin}
                  />
                )}
              </div>
            </TooltipComponent>
          </HamburgerContainer>
          <TooltipComponent
            content={createMessage(LOGO_TOOLTIP)}
            hoverOpenDelay={TOOLTIP_HOVER_ON_DELAY}
            position={Position.BOTTOM_LEFT}
          >
            <AppsmithLink to={APPLICATIONS_URL}>
              <img
                alt="Appsmith logo"
                className="t--appsmith-logo"
                src={AppsmithLogo}
              />
            </AppsmithLink>
          </TooltipComponent>

          <TooltipComponent
            autoFocus={false}
            content={createMessage(RENAME_APPLICATION_TOOLTIP)}
            disabled={isPopoverOpen}
            hoverOpenDelay={TOOLTIP_HOVER_ON_DELAY}
            openOnTargetFocus={false}
            position={Position.BOTTOM}
          >
            <EditorAppName
              applicationId={applicationId}
              className="t--application-name editable-application-name max-w-48"
              currentDeployLink={getApplicationViewerPageURL({
                applicationId: props.applicationId,
                pageId,
              })}
              defaultSavingState={
                isSavingName ? SavingState.STARTED : SavingState.NOT_STARTED
              }
              defaultValue={currentApplication?.name || ""}
              deploy={() => handleClickDeploy(false)}
              editInteractionKind={EditInteractionKind.SINGLE}
              fill
              isError={isErroredSavingName}
              isNewApp={
                applicationList.filter((el) => el.id === applicationId).length >
                0
              }
              isPopoverOpen={isPopoverOpen}
              onBlur={(value: string) =>
                updateApplicationDispatch(applicationId || "", {
                  name: value,
                  currentApp: true,
                })
              }
              setIsPopoverOpen={setIsPopoverOpen}
            />
          </TooltipComponent>
          {!shouldHideComments && (
            <ToggleModeButton showSelectedMode={!isPopoverOpen} />
          )}
        </HeaderSection>
        <HeaderSection
          className={classNames({
            "-translate-y-full opacity-0": isPreviewMode,
            "translate-y-0 opacity-100": !isPreviewMode,
            "transition-all transform duration-400": true,
          })}
        >
          <HelpBar />
          <HelpButton />
        </HeaderSection>
        <HeaderSection className="space-x-3">
          <EditorSaveIndicator />
          <Boxed
            alternative={<EndTour />}
            step={GUIDED_TOUR_STEPS.BUTTON_ONSUCCESS_BINDING}
          >
            <RealtimeAppEditors applicationId={applicationId} />
            <FormDialogComponent
              Form={AppInviteUsersForm}
              applicationId={applicationId}
              canOutsideClickClose
              headerIcon={{
                name: "right-arrow",
                bgColor: Colors.GEYSER_LIGHT,
              }}
              isOpen={showAppInviteUsersDialog}
              orgId={orgId}
              title={
                currentApplication
                  ? currentApplication.name
                  : "Share Application"
              }
              trigger={
                <TooltipComponent
                  content={
                    filteredSharedUserList.length
                      ? createMessage(
                          SHARE_BUTTON_TOOLTIP_WITH_USER(
                            filteredSharedUserList.length,
                          ),
                        )
                      : createMessage(SHARE_BUTTON_TOOLTIP)
                  }
                  hoverOpenDelay={TOOLTIP_HOVER_ON_DELAY}
                  position={Position.BOTTOM}
                >
                  <ShareButtonComponent />
                </TooltipComponent>
              }
            />
            <DeploySection>
              <TooltipComponent
                content={createMessage(DEPLOY_BUTTON_TOOLTIP)}
                hoverOpenDelay={TOOLTIP_HOVER_ON_DELAY}
                position={Position.BOTTOM_RIGHT}
              >
                <StyledDeployButton
                  className="t--application-publish-btn"
                  data-guided-tour-iid="deploy"
                  isLoading={isPublishing}
                  onClick={() => handleClickDeploy(true)}
                  size={Size.small}
                  text={"Deploy"}
                />
              </TooltipComponent>

              <DeployLinkButtonDialog
                link={getApplicationViewerPageURL({
                  applicationId: props.applicationId,
                  pageId,
                })}
                trigger={
                  <StyledDeployIcon
                    fillColor="#fff"
                    name={"down-arrow"}
                    size={IconSize.XXL}
                  />
                }
              />
            </DeploySection>
          </Boxed>
          {user && user.username !== ANONYMOUS_USERNAME && (
            <ProfileDropdownContainer>
              <ProfileDropdown
                name={user.name}
                photoId={user?.photoId}
                userName={user?.username || ""}
              />
            </ProfileDropdownContainer>
          )}
        </HeaderSection>
        <Suspense fallback={<span />}>
          <GlobalSearch />
        </Suspense>
        {isSnipingMode && (
          <BindingBanner className="t--sniping-mode-banner">
            Select a widget to bind
          </BindingBanner>
        )}
      </HeaderWrapper>
    </ThemeProvider>
  );
}

const theme = getTheme(ThemeMode.LIGHT);

const mapStateToProps = (state: AppState) => ({
  pageName: state.ui.editor.currentPageName,
  orgId: getCurrentOrgId(state),
  applicationId: getCurrentApplicationId(state),
  currentApplication: state.ui.applications.currentApplication,
  isPublishing: getIsPublishingApplication(state),
  pageId: getCurrentPageId(state),
  sharedUserList: getAllUsers(state),
  currentUser: getCurrentUser(state),
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

EditorHeader.whyDidYouRender = {
  logOnDifferentValues: false,
};

export default connect(mapStateToProps, mapDispatchToProps)(EditorHeader);
