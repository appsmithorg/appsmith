import React, {
  useCallback,
  useEffect,
  useState,
  lazy,
  Suspense,
  useContext,
} from "react";
import styled, { ThemeProvider } from "styled-components";
import classNames from "classnames";
import { APPLICATIONS_URL } from "constants/routes";
import AppInviteUsersForm from "pages/workspace/AppInviteUsersForm";
import AnalyticsUtil from "utils/AnalyticsUtil";
import AppsmithLogo from "assets/images/appsmith_logo_square.png";
import { Link } from "react-router-dom";
import {
  getApplicationLastDeployedAt,
  getCurrentApplicationId,
  getCurrentPageId,
  getIsPublishingApplication,
  previewModeSelector,
} from "selectors/editorSelectors";
import {
  getAllUsers,
  getCurrentAppWorkspace,
  getCurrentWorkspaceId,
} from "@appsmith/selectors/workspaceSelectors";
import { useDispatch, useSelector } from "react-redux";
import DeployLinkButtonDialog from "components/designSystems/appsmith/header/DeployLinkButton";
import {
  publishApplication,
  updateApplication,
} from "@appsmith/actions/applicationActions";
import {
  getApplicationList,
  getIsSavingAppName,
  getIsErroredSavingAppName,
  getCurrentApplication,
} from "@appsmith/selectors/applicationSelectors";
import EditorAppName from "./EditorAppName";
import { getCurrentUser } from "selectors/usersSelectors";
import {
  EditInteractionKind,
  SavingState,
  getTypographyByKey,
} from "design-system-old";
import {
  Button,
  Icon,
  Tooltip,
  Modal,
  ModalHeader,
  ModalContent,
  ModalBody,
  Tabs,
  TabsList,
  Tab,
  TabPanel,
} from "design-system";
import { Profile } from "pages/common/ProfileImage";
import HelpBar from "components/editorComponents/GlobalSearch/HelpBar";
import { getTheme, ThemeMode } from "selectors/themeSelectors";
import ToggleModeButton from "pages/Editor/ToggleModeButton";
import { snipingModeSelector } from "selectors/editorSelectors";
import { showConnectGitModal } from "actions/gitSyncActions";
import RealtimeAppEditors from "./RealtimeAppEditors";
import { EditorSaveIndicator } from "./EditorSaveIndicator";
import {
  adaptiveSignpostingEnabled,
  selectFeatureFlags,
} from "@appsmith/selectors/featureFlagsSelectors";
import { retryPromise } from "utils/AppsmithUtils";
import { fetchUsersForWorkspace } from "@appsmith/actions/workspaceActions";

import { getIsGitConnected } from "selectors/gitSyncSelectors";
import {
  CLOSE_ENTITY_EXPLORER_MESSAGE,
  createMessage,
  DEPLOY_BUTTON_TOOLTIP,
  DEPLOY_MENU_OPTION,
  EDITOR_HEADER,
  INVITE_TAB,
  IN_APP_EMBED_SETTING,
  LOCK_ENTITY_EXPLORER_MESSAGE,
  LOGO_TOOLTIP,
  RENAME_APPLICATION_TOOLTIP,
  SHARE_BUTTON_TOOLTIP,
  SHARE_BUTTON_TOOLTIP_WITH_USER,
  COMMUNITY_TEMPLATES,
  APPLICATION_INVITE,
} from "@appsmith/constants/messages";
import { getExplorerPinned } from "selectors/explorerSelector";
import {
  setExplorerActiveAction,
  setExplorerPinnedAction,
} from "actions/explorerActions";
import { modText } from "utils/helpers";
import Boxed from "./GuidedTour/Boxed";
import EndTour from "./GuidedTour/EndTour";
import { GUIDED_TOUR_STEPS } from "./GuidedTour/constants";
import { viewerURL } from "RouteBuilder";
import { useHref } from "./utils";
import { getAppsmithConfigs } from "@appsmith/configs";
import { getIsAppSettingsPaneWithNavigationTabOpen } from "selectors/appSettingsPaneSelectors";
import type { NavigationSetting } from "constants/AppConstants";
import { getUserPreferenceFromStorage } from "@appsmith/utils/Environments";
import { showEnvironmentDeployInfoModal } from "@appsmith/actions/environmentAction";
import {
  getIsFirstTimeUserOnboardingEnabled,
  isWidgetActionConnectionPresent,
} from "selectors/onboardingSelectors";
import WalkthroughContext from "components/featureWalkthrough/walkthroughContext";
import { getFeatureWalkthroughShown } from "utils/storage";
import { FEATURE_WALKTHROUGH_KEYS } from "constants/WalkthroughConstants";
import { SignpostingWalkthroughConfig } from "./FirstTimeUserOnboarding/Utils";
import CommunityTemplatesPublishInfo from "./CommunityTemplates/Modals/CommunityTemplatesPublishInfo";
import PublishCommunityTemplateModal from "./CommunityTemplates/Modals/PublishCommunityTemplate";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { getEmbedSnippetForm } from "@appsmith/utils/BusinessFeatures/privateEmbedHelpers";

const { cloudHosting } = getAppsmithConfigs();

const HeaderWrapper = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  background-color: var(--ads-v2-color-bg);
  flex-direction: row;
  box-shadow: none;
  border-bottom: 1px solid var(--ads-v2-color-border);
  height: ${(props) => props.theme.smallHeaderHeight};
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
    & .app-realtime-editors {
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
`;

const AppsmithLink = styled((props) => {
  // we are removing non input related props before passing them in the components
  // eslint-disable @typescript-eslint/no-unused-vars
  return <Link {...props} />;
})`
  height: 24px;
  min-width: 24px;
  width: 24px;
  display: inline-block;
  img {
    min-width: 24px;
    width: 24px;
    height: 24px;
  }
`;

const BindingBanner = styled.div`
  position: fixed;
  width: 199px;
  height: 36px;
  left: 50%;
  top: ${(props) => props.theme.smallHeaderHeight};
  transform: translate(-50%, 0);
  text-align: center;
  background: var(--ads-v2-color-fg-information);
  color: var(--ads-v2-color-white);
  border-radius: var(--ads-v2-border-radius);
  font-weight: 500;
  font-size: 15px;
  line-height: 20px;
  /* Depth: 01 */
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--ads-v2-shadow-popovers);
  z-index: 9999;
`;

const SidebarNavButton = styled(Button)`
  .ads-v2-button__content {
    padding: 0;
  }
  .group {
    height: 36px;
    width: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const GlobalSearch = lazy(async () => {
  return retryPromise(
    async () =>
      import(
        /* webpackChunkName: "global-search" */ "components/editorComponents/GlobalSearch"
      ),
  );
});

const theme = getTheme(ThemeMode.LIGHT);

export function EditorHeader() {
  const [activeTab, setActiveTab] = useState("invite");
  const dispatch = useDispatch();
  const isSnipingMode = useSelector(snipingModeSelector);
  const isSavingName = useSelector(getIsSavingAppName);
  const pinned = useSelector(getExplorerPinned);
  const isGitConnected = useSelector(getIsGitConnected);
  const isErroredSavingName = useSelector(getIsErroredSavingAppName);
  const applicationList = useSelector(getApplicationList);
  const isPreviewMode = useSelector(previewModeSelector);
  const signpostingEnabled = useSelector(getIsFirstTimeUserOnboardingEnabled);
  const workspaceId = useSelector(getCurrentWorkspaceId);
  const currentWorkspace = useSelector(getCurrentAppWorkspace);
  const applicationId = useSelector(getCurrentApplicationId);
  const currentApplication = useSelector(getCurrentApplication);
  const isPublishing = useSelector(getIsPublishingApplication);
  const pageId = useSelector(getCurrentPageId) as string;
  const sharedUserList = useSelector(getAllUsers);
  const currentUser = useSelector(getCurrentUser);
  const featureFlags = useSelector(selectFeatureFlags);

  const deployLink = useHref(viewerURL, { pageId });
  const isAppSettingsPaneWithNavigationTabOpen = useSelector(
    getIsAppSettingsPaneWithNavigationTabOpen,
  );
  const isPreviewingApp =
    isPreviewMode || isAppSettingsPaneWithNavigationTabOpen;

  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  const [showModal, setShowModal] = useState(false);
  const isMultipleEnvEnabled = useFeatureFlag(
    FEATURE_FLAG.release_datasource_environments_enabled,
  );
  const [
    showPublishCommunityTemplateModal,
    setShowPublishCommunityTemplateModal,
  ] = useState(false);

  const handlePublish = () => {
    if (applicationId) {
      dispatch(publishApplication(applicationId));

      const appName = currentApplication ? currentApplication.name : "";
      const pageCount = currentApplication?.pages?.length;
      const navigationSettingsWithPrefix: Record<
        string,
        NavigationSetting[keyof NavigationSetting]
      > = {};

      if (currentApplication?.applicationDetail?.navigationSetting) {
        const settingKeys = Object.keys(
          currentApplication.applicationDetail.navigationSetting,
        ) as Array<keyof NavigationSetting>;

        settingKeys.map((key: keyof NavigationSetting) => {
          if (currentApplication?.applicationDetail?.navigationSetting?.[key]) {
            const value: NavigationSetting[keyof NavigationSetting] =
              currentApplication.applicationDetail.navigationSetting[key];

            navigationSettingsWithPrefix[`navigationSetting_${key}`] = value;
          }
        });
      }

      AnalyticsUtil.logEvent("PUBLISH_APP", {
        appId: applicationId,
        appName,
        pageCount,
        ...navigationSettingsWithPrefix,
        isPublic: !!currentApplication?.isPublic,
      });
    }
  };

  const updateApplicationDispatch = (
    id: string,
    data: { name: string; currentApp: boolean },
  ) => {
    dispatch(updateApplication(id, data));
  };

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
        if (
          !isMultipleEnvEnabled ||
          getUserPreferenceFromStorage() === "true"
        ) {
          handlePublish();
        } else {
          dispatch(showEnvironmentDeployInfoModal());
        }
      }

      closeWalkthrough();
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
  const filteredSharedUserList = sharedUserList.filter(
    (user) => user.username !== currentUser?.username,
  );

  const {
    isOpened: isWalkthroughOpened,
    popFeature,
    pushFeature,
  } = useContext(WalkthroughContext) || {};
  const adaptiveSignposting = useSelector(adaptiveSignpostingEnabled);
  const isConnectionPresent = useSelector(isWidgetActionConnectionPresent);
  const isDeployed = !!useSelector(getApplicationLastDeployedAt);
  const isPrivateEmbedEnabled = useFeatureFlag(
    FEATURE_FLAG.license_private_embeds_enabled,
  );
  useEffect(() => {
    if (
      signpostingEnabled &&
      isConnectionPresent &&
      adaptiveSignposting &&
      !isDeployed
    ) {
      checkAndShowWalkthrough();
    }
  }, [
    signpostingEnabled,
    isConnectionPresent,
    adaptiveSignposting,
    isDeployed,
  ]);
  const closeWalkthrough = () => {
    if (popFeature && isWalkthroughOpened) {
      popFeature();
    }
  };
  const checkAndShowWalkthrough = async () => {
    const isFeatureWalkthroughShown = await getFeatureWalkthroughShown(
      FEATURE_WALKTHROUGH_KEYS.deploy,
    );
    !isFeatureWalkthroughShown &&
      pushFeature &&
      pushFeature(SignpostingWalkthroughConfig.DEPLOY_APP, true);
  };

  const isGACEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  return (
    <ThemeProvider theme={theme}>
      <HeaderWrapper
        className="pl-1 pr-1 overflow-hidden"
        data-testid="t--appsmith-editor-header"
      >
        <HeaderSection className="space-x-2">
          {!signpostingEnabled && (
            <Tooltip
              content={
                <div className="flex items-center justify-between">
                  <span>
                    {!pinned
                      ? createMessage(LOCK_ENTITY_EXPLORER_MESSAGE)
                      : createMessage(CLOSE_ENTITY_EXPLORER_MESSAGE)}
                  </span>
                  <span className="ml-4">{modText()} /</span>
                </div>
              }
              placement="bottomLeft"
            >
              <SidebarNavButton
                className={classNames({
                  "transition-all transform duration-400": true,
                  "-translate-x-full opacity-0": isPreviewingApp,
                  "translate-x-0 opacity-100": !isPreviewingApp,
                })}
                data-testid="sidebar-nav-button"
                kind="tertiary"
                onClick={onPin}
                size="md"
              >
                <div
                  className="relative t--pin-entity-explorer group"
                  onMouseEnter={onMenuHover}
                >
                  <Icon
                    className="absolute transition-opacity group-hover:opacity-0"
                    name="hamburger"
                    size="md"
                  />
                  {pinned && (
                    <Icon
                      className="absolute transition-opacity opacity-0 group-hover:opacity-100"
                      name="menu-fold"
                      onClick={onPin}
                      size="md"
                    />
                  )}
                  {!pinned && (
                    <Icon
                      className="absolute transition-opacity opacity-0 group-hover:opacity-100"
                      name="menu-unfold"
                      onClick={onPin}
                      size="md"
                    />
                  )}
                </div>
              </SidebarNavButton>
            </Tooltip>
          )}

          <Tooltip content={createMessage(LOGO_TOOLTIP)} placement="bottomLeft">
            <AppsmithLink
              className={classNames({
                "ml-2": signpostingEnabled,
              })}
              to={APPLICATIONS_URL}
            >
              <img
                alt="Appsmith logo"
                className="t--appsmith-logo"
                src={AppsmithLogo}
              />
            </AppsmithLink>
          </Tooltip>

          <Tooltip
            content={createMessage(RENAME_APPLICATION_TOOLTIP)}
            isDisabled={isPopoverOpen}
            placement="bottom"
          >
            <div>
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
                  applicationList.filter((el) => el.id === applicationId)
                    .length > 0
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
            </div>
          </Tooltip>
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
        <HeaderSection className="gap-x-1">
          <Boxed
            alternative={<EndTour />}
            step={GUIDED_TOUR_STEPS.BUTTON_ONSUCCESS_BINDING}
          >
            <RealtimeAppEditors applicationId={applicationId} />
            <ToggleModeButton />
            {applicationId && (
              <Tooltip
                content={
                  filteredSharedUserList.length
                    ? createMessage(
                        SHARE_BUTTON_TOOLTIP_WITH_USER(
                          filteredSharedUserList.length,
                        ),
                      )
                    : createMessage(SHARE_BUTTON_TOOLTIP)
                }
                placement="bottom"
              >
                <Button
                  className="t--application-share-btn"
                  kind="tertiary"
                  onClick={() => setShowModal(true)}
                  size="md"
                  startIcon="share-line"
                >
                  {createMessage(EDITOR_HEADER.share)}
                </Button>
              </Tooltip>
            )}
            <Modal
              onOpenChange={(isOpen) => setShowModal(isOpen)}
              open={showModal}
            >
              <ModalContent style={{ width: "640px" }}>
                <ModalHeader>
                  {createMessage(
                    APPLICATION_INVITE,
                    currentWorkspace.name,
                    !isGACEnabled,
                  )}
                </ModalHeader>
                <ModalBody>
                  <Tabs
                    onValueChange={(value) => setActiveTab(value)}
                    value={activeTab}
                  >
                    <TabsList>
                      <Tab data-testid="t--tab-INVITE" value="invite">
                        {createMessage(INVITE_TAB)}
                      </Tab>
                      <Tab data-testid="t--tab-EMBED" value="embed">
                        {createMessage(IN_APP_EMBED_SETTING.embed)}
                      </Tab>
                      {featureFlags.release_show_publish_app_to_community_enabled &&
                        cloudHosting && (
                          <Tab data-testid="t--tab-PUBLISH" value="publish">
                            {createMessage(COMMUNITY_TEMPLATES.publish)}
                          </Tab>
                        )}
                    </TabsList>
                    <TabPanel value="invite">
                      <AppInviteUsersForm
                        applicationId={applicationId}
                        workspaceId={workspaceId}
                      />
                    </TabPanel>
                    <TabPanel value="embed">
                      {getEmbedSnippetForm(isPrivateEmbedEnabled, setActiveTab)}
                    </TabPanel>
                    {cloudHosting && (
                      <TabPanel value="publish">
                        <CommunityTemplatesPublishInfo
                          onPublishClick={() =>
                            setShowPublishCommunityTemplateModal(true)
                          }
                          setShowHostModal={setShowModal}
                        />
                      </TabPanel>
                    )}
                  </Tabs>
                </ModalBody>
              </ModalContent>
            </Modal>
            <PublishCommunityTemplateModal
              onPublishSuccess={() => {
                setShowPublishCommunityTemplateModal(false);
                setShowModal(true);
              }}
              setShowModal={setShowPublishCommunityTemplateModal}
              showModal={showPublishCommunityTemplateModal}
            />
            <div className="flex items-center">
              <Tooltip
                content={createMessage(DEPLOY_BUTTON_TOOLTIP)}
                placement="bottomRight"
              >
                <Button
                  className="t--application-publish-btn"
                  data-guided-tour-iid="deploy"
                  id={"application-publish-btn"}
                  isLoading={isPublishing}
                  kind="tertiary"
                  onClick={() => handleClickDeploy(true)}
                  size="md"
                  startIcon={"rocket"}
                >
                  {DEPLOY_MENU_OPTION()}
                </Button>
              </Tooltip>

              <DeployLinkButtonDialog link={deployLink} trigger="" />
            </div>
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

export default EditorHeader;
