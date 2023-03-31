import React, {
  useCallback,
  useEffect,
  useState,
  lazy,
  Suspense,
  useMemo,
} from "react";
import styled, { ThemeProvider } from "styled-components";
import classNames from "classnames";
import { Classes as Popover2Classes } from "@blueprintjs/popover2";
import type { ApplicationPayload } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { APPLICATIONS_URL } from "constants/routes";
import AppInviteUsersForm from "pages/workspace/AppInviteUsersForm";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { FormDialogComponent } from "components/editorComponents/form/FormDialogComponent";
import AppsmithLogo from "assets/images/appsmith_logo_square.png";
import { Link } from "react-router-dom";
import type { AppState } from "@appsmith/reducers";
import {
  getCurrentApplicationId,
  getCurrentPageId,
  getIsPublishingApplication,
  previewModeSelector,
} from "selectors/editorSelectors";
import {
  getAllUsers,
  getCurrentWorkspaceId,
} from "@appsmith/selectors/workspaceSelectors";
import { connect, useDispatch, useSelector } from "react-redux";
import DeployLinkButtonDialog from "components/designSystems/appsmith/header/DeployLinkButton";
import {
  setShowAppInviteUsersDialog,
  updateApplication,
} from "@appsmith/actions/applicationActions";
import {
  getApplicationList,
  getIsSavingAppName,
  getIsErroredSavingAppName,
  showAppInviteUsersDialogSelector,
} from "@appsmith/selectors/applicationSelectors";
import EditorAppName from "./EditorAppName";
import { getCurrentUser } from "selectors/usersSelectors";
import type { User } from "constants/userConstants";
import {
  Category,
  EditInteractionKind,
  IconPositions,
  SavingState,
  Button,
  getTypographyByKey,
  Icon,
  IconSize,
  TooltipComponent,
  Size,
} from "design-system-old";
import { Profile } from "pages/common/ProfileImage";
import HelpBar from "components/editorComponents/GlobalSearch/HelpBar";
import { getTheme, ThemeMode } from "selectors/themeSelectors";
import ToggleModeButton from "pages/Editor/ToggleModeButton";
import { Colors } from "constants/Colors";
import { snipingModeSelector } from "selectors/editorSelectors";
import { showConnectGitModal } from "actions/gitSyncActions";
import RealtimeAppEditors from "./RealtimeAppEditors";
import { EditorSaveIndicator } from "./EditorSaveIndicator";

import { retryPromise } from "utils/AppsmithUtils";
import { fetchUsersForWorkspace } from "@appsmith/actions/workspaceActions";
import type { WorkspaceUser } from "@appsmith/constants/workspaceConstants";

import { getIsGitConnected } from "selectors/gitSyncSelectors";
import {
  CLOSE_ENTITY_EXPLORER_MESSAGE,
  createMessage,
  DEPLOY_BUTTON_TOOLTIP,
  DEPLOY_MENU_OPTION,
  EDITOR_HEADER,
  INVITE_TAB,
  INVITE_USERS_PLACEHOLDER,
  IN_APP_EMBED_SETTING,
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
import { modText } from "utils/helpers";
import Boxed from "./GuidedTour/Boxed";
import EndTour from "./GuidedTour/EndTour";
import { GUIDED_TOUR_STEPS } from "./GuidedTour/constants";
import { viewerURL } from "RouteBuilder";
import { useHref } from "./utils";
import EmbedSnippetForm from "pages/Applications/EmbedSnippetTab";
import { getAppsmithConfigs } from "@appsmith/configs";
import { isMultiPaneActive } from "selectors/multiPaneSelectors";
import { getIsAppSettingsPaneWithNavigationTabOpen } from "selectors/appSettingsPaneSelectors";

const { cloudHosting } = getAppsmithConfigs();

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
    ${getTypographyByKey("h4")}
    color: ${(props) => props.theme.colors.header.appName};
  }
  & ${Profile} {
    width: 24px;
    height: 24px;
  }

  @media only screen and (max-width: 900px) {
    & .help-bar {
      display: none;
    }
  }

  @media only screen and (max-width: 700px) {
    & .app-realtume-editors {
      display: none;
    }
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
  height: 24px;
  width: 24px;
  display: inline-block;
  img {
    width: 24px;
    height: 24px;
  }
`;

const DeploySection = styled.div`
  display: flex;
  align-items: center;
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
  height: ${(props) => props.theme.smallHeaderHeight};
  width: 20px;
  align-self: center;
  &:hover {
    background-color: ${Colors.GRAY_100};
  }
`;

const HamburgerContainer = styled.div`
  height: ${(props) => props.theme.smallHeaderHeight};
  width: 34px;

  :hover {
    background-color: ${Colors.GEYSER_LIGHT};
  }
`;

const StyledButton = styled(Button)`
  padding: 0 6px;
  height: ${(props) => props.theme.smallHeaderHeight};
  color: ${Colors.GREY_900};

  svg {
    height: 18px;
    width: 18px;
  }
`;

type EditorHeaderProps = {
  pageSaveError?: boolean;
  pageName?: string;
  pageId: string;
  isPublishing: boolean;
  publishedTime?: string;
  workspaceId: string;
  applicationId?: string;
  currentApplication?: ApplicationPayload;
  isSaving: boolean;
  publishApplication: (appId: string) => void;
  lastUpdatedTime?: number;
  inOnboarding: boolean;
  sharedUserList: WorkspaceUser[];
  currentUser?: User;
};

const GlobalSearch = lazy(() => {
  return retryPromise(() => import("components/editorComponents/GlobalSearch"));
});

export function ShareButtonComponent() {
  return (
    <StyledButton
      category={Category.tertiary}
      className="t--application-share-btn"
      icon={"share-line"}
      iconPosition={IconPositions.left}
      size={Size.medium}
      tag={"button"}
      text={createMessage(EDITOR_HEADER.share)}
    />
  );
}

const theme = getTheme(ThemeMode.LIGHT);

export function EditorHeader(props: EditorHeaderProps) {
  const {
    applicationId,
    currentApplication,
    isPublishing,
    pageId,
    publishApplication,
    workspaceId,
  } = props;
  const dispatch = useDispatch();
  const isSnipingMode = useSelector(snipingModeSelector);
  const isSavingName = useSelector(getIsSavingAppName);
  const pinned = useSelector(getExplorerPinned);
  const isGitConnected = useSelector(getIsGitConnected);
  const isErroredSavingName = useSelector(getIsErroredSavingAppName);
  const applicationList = useSelector(getApplicationList);
  const isPreviewMode = useSelector(previewModeSelector);
  const deployLink = useHref(viewerURL, { pageId });
  const isMultiPane = useSelector(isMultiPaneActive);
  const isAppSettingsPaneWithNavigationTabOpen = useSelector(
    getIsAppSettingsPaneWithNavigationTabOpen,
  );
  const isPreviewingApp =
    isPreviewMode || isAppSettingsPaneWithNavigationTabOpen;

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
      if (isGitConnected) {
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
    [dispatch, handlePublish],
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
    if (workspaceId) {
      dispatch(fetchUsersForWorkspace(workspaceId));
    }
  }, [workspaceId]);
  const filteredSharedUserList = props.sharedUserList.filter(
    (user) => user.username !== props.currentUser?.username,
  );

  const tabs = useMemo(() => {
    return [
      {
        key: "INVITE",
        title: createMessage(INVITE_TAB),
        component: AppInviteUsersForm,
      },
      {
        key: "EMBED",
        title: createMessage(IN_APP_EMBED_SETTING.embed),
        component: EmbedSnippetForm,
      },
    ];
  }, []);

  const handleFormOpenOrClose = useCallback((isOpen: boolean) => {
    dispatch(setShowAppInviteUsersDialog(isOpen));
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <HeaderWrapper
        className="pl-1 pr-1"
        data-testid="t--appsmith-editor-header"
      >
        <HeaderSection className="space-x-2">
          {!isMultiPane && (
            <HamburgerContainer
              className={classNames({
                "relative flex items-center justify-center p-0 text-gray-800 transition-all transform duration-400":
                  true,
                "-translate-x-full opacity-0": isPreviewingApp,
                "translate-x-0 opacity-100": !isPreviewingApp,
              })}
            >
              <TooltipComponent
                content={
                  <div className="flex items-center justify-between">
                    <span>
                      {!pinned
                        ? createMessage(LOCK_ENTITY_EXPLORER_MESSAGE)
                        : createMessage(CLOSE_ENTITY_EXPLORER_MESSAGE)}
                    </span>
                    <span className="ml-4 text-xs text-gray-300">
                      {modText()} /
                    </span>
                  </div>
                }
                position="bottom-left"
              >
                <div
                  className="relative w-4 h-4 text-trueGray-600 group t--pin-entity-explorer"
                  onMouseEnter={onMenuHover}
                >
                  <MenuIcon className="absolute w-3.5 h-3.5 transition-opacity cursor-pointer fill-current group-hover:opacity-0" />
                  {!pinned && (
                    <UnpinIcon
                      className="absolute w-3.5 h-3.5 transition-opacity opacity-0 cursor-pointer fill-current group-hover:opacity-100"
                      onClick={onPin}
                    />
                  )}
                  {pinned && (
                    <PinIcon
                      className="absolute w-3.5 h-3.5 transition-opacity opacity-0 cursor-pointer fill-current group-hover:opacity-100"
                      onClick={onPin}
                    />
                  )}
                </div>
              </TooltipComponent>
            </HamburgerContainer>
          )}

          <TooltipComponent
            content={createMessage(LOGO_TOOLTIP)}
            hoverOpenDelay={TOOLTIP_HOVER_ON_DELAY}
            position="bottom-left"
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
            position="bottom"
          >
            <EditorAppName
              applicationId={applicationId}
              className="t--application-name editable-application-name max-w-48"
              defaultSavingState={
                isSavingName ? SavingState.STARTED : SavingState.NOT_STARTED
              }
              defaultValue={currentApplication?.name || ""}
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
          <EditorSaveIndicator />
        </HeaderSection>
        <HeaderSection
          className={classNames({
            "-translate-y-full opacity-0": isPreviewMode,
            "translate-y-0 opacity-100": !isPreviewMode,
            "transition-all transform duration-400": true,
            "help-bar": "true",
          })}
        >
          <HelpBar />
        </HeaderSection>
        <HeaderSection className="gap-x-2">
          <Boxed
            alternative={<EndTour />}
            step={GUIDED_TOUR_STEPS.BUTTON_ONSUCCESS_BINDING}
          >
            <RealtimeAppEditors applicationId={applicationId} />
            <ToggleModeButton />
            <FormDialogComponent
              Form={AppInviteUsersForm}
              applicationId={applicationId}
              canOutsideClickClose
              isOpen={showAppInviteUsersDialog}
              noModalBodyMarginTop
              onOpenOrClose={handleFormOpenOrClose}
              placeholder={createMessage(
                INVITE_USERS_PLACEHOLDER,
                cloudHosting,
              )}
              tabs={tabs}
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
                  position="bottom"
                >
                  <ShareButtonComponent />
                </TooltipComponent>
              }
              workspaceId={workspaceId}
            />
            <DeploySection>
              <TooltipComponent
                content={createMessage(DEPLOY_BUTTON_TOOLTIP)}
                hoverOpenDelay={TOOLTIP_HOVER_ON_DELAY}
                position="bottom-right"
              >
                <StyledButton
                  category={Category.tertiary}
                  className="t--application-publish-btn"
                  data-guided-tour-iid="deploy"
                  icon={"rocket"}
                  iconPosition={IconPositions.left}
                  isLoading={isPublishing}
                  onClick={() => handleClickDeploy(true)}
                  size={Size.medium}
                  tag={"button"}
                  text={DEPLOY_MENU_OPTION()}
                  width={"88px"}
                />
              </TooltipComponent>

              <DeployLinkButtonDialog
                link={deployLink}
                trigger={
                  <StyledDeployIcon
                    fill={Colors.GREY_900}
                    name={"down-arrow"}
                    size={IconSize.XXL}
                  />
                }
              />
            </DeploySection>
          </Boxed>
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

const mapStateToProps = (state: AppState) => ({
  pageName: state.ui.editor.currentPageName,
  workspaceId: getCurrentWorkspaceId(state),
  applicationId: getCurrentApplicationId(state),
  currentApplication: state.ui.applications.currentApplication,
  isPublishing: getIsPublishingApplication(state),
  pageId: getCurrentPageId(state) as string,
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
