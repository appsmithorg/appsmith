import React, { useCallback, useEffect, useState } from "react";
import { ThemeProvider } from "styled-components";
import AppInviteUsersForm from "pages/workspace/AppInviteUsersForm";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  combinedPreviewModeSelector,
  getCurrentApplicationId,
  getCurrentPageId,
  getIsPageSaving,
  getIsPublishingApplication,
  getPageSavingError,
} from "selectors/editorSelectors";
import {
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
import EditorName from "./EditorName";
import { EditInteractionKind, SavingState } from "design-system-old";
import {
  Button,
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
import { getTheme, ThemeMode } from "selectors/themeSelectors";
import ToggleModeButton from "pages/Editor/ToggleModeButton";
import { showConnectGitModal } from "actions/gitSyncActions";
import RealtimeAppEditors from "./RealtimeAppEditors";
import { EditorSaveIndicator } from "./EditorSaveIndicator";
import { selectFeatureFlags } from "@appsmith/selectors/featureFlagsSelectors";
import { fetchUsersForWorkspace } from "@appsmith/actions/workspaceActions";

import {
  getIsGitConnected,
  protectedModeSelector,
} from "selectors/gitSyncSelectors";
import {
  createMessage,
  DEPLOY_BUTTON_TOOLTIP,
  DEPLOY_MENU_OPTION,
  INVITE_TAB,
  IN_APP_EMBED_SETTING,
  RENAME_APPLICATION_TOOLTIP,
  COMMUNITY_TEMPLATES,
  APPLICATION_INVITE,
} from "@appsmith/constants/messages";
import Boxed from "./GuidedTour/Boxed";
import EndTour from "./GuidedTour/EndTour";
import { GUIDED_TOUR_STEPS } from "./GuidedTour/constants";
import { viewerURL } from "@appsmith/RouteBuilder";
import { useHref } from "./utils";
import { getAppsmithConfigs } from "@appsmith/configs";
import { getIsAppSettingsPaneWithNavigationTabOpen } from "selectors/appSettingsPaneSelectors";
import type { NavigationSetting } from "constants/AppConstants";
import CommunityTemplatesPublishInfo from "./CommunityTemplates/Modals/CommunityTemplatesPublishInfo";
import PublishCommunityTemplateModal from "./CommunityTemplates/Modals/PublishCommunityTemplate";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { getEmbedSnippetForm } from "@appsmith/utils/BusinessFeatures/privateEmbedHelpers";
import { HeaderSection, HeaderWrapper } from "./commons/EditorHeaderComponents";
import { LockEntityExplorer } from "./commons/LockEntityExplorer";
import { Omnibar } from "./commons/Omnibar";
import { EditorShareButton } from "./EditorShareButton";
import { HelperBarInHeader } from "./HelpBarInHeader";
import { AppsmithLink } from "./AppsmithLink";
import { getIsFirstTimeUserOnboardingEnabled } from "selectors/onboardingSelectors";
import { GetNavigationMenuData } from "./EditorName/NavigationMenuData";
import { useIsAppSidebarEnabled } from "../../navigation/featureFlagHooks";

const { cloudHosting } = getAppsmithConfigs();

const theme = getTheme(ThemeMode.LIGHT);

export function EditorHeader() {
  const [activeTab, setActiveTab] = useState("invite");
  const dispatch = useDispatch();
  const isSavingName = useSelector(getIsSavingAppName);
  const isGitConnected = useSelector(getIsGitConnected);
  const isErroredSavingName = useSelector(getIsErroredSavingAppName);
  const applicationList = useSelector(getApplicationList);
  const isPreviewMode = useSelector(combinedPreviewModeSelector);
  const signpostingEnabled = useSelector(getIsFirstTimeUserOnboardingEnabled);
  const workspaceId = useSelector(getCurrentWorkspaceId);
  const currentWorkspace = useSelector(getCurrentAppWorkspace);
  const applicationId = useSelector(getCurrentApplicationId);
  const currentApplication = useSelector(getCurrentApplication);
  const isPublishing = useSelector(getIsPublishingApplication);
  const pageId = useSelector(getCurrentPageId) as string;
  const featureFlags = useSelector(selectFeatureFlags);
  const isSaving = useSelector(getIsPageSaving);
  const pageSaveError = useSelector(getPageSavingError);
  const isProtectedMode = useSelector(protectedModeSelector);

  const deployLink = useHref(viewerURL, { pageId });
  const isAppSettingsPaneWithNavigationTabOpen = useSelector(
    getIsAppSettingsPaneWithNavigationTabOpen,
  );
  const isPreviewingApp =
    isPreviewMode || isAppSettingsPaneWithNavigationTabOpen;

  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  const [showModal, setShowModal] = useState(false);
  const [
    showPublishCommunityTemplateModal,
    setShowPublishCommunityTemplateModal,
  ] = useState(false);

  const isAppSidebarEnabled = useIsAppSidebarEnabled();

  const showEntityExplorerLock = !isAppSidebarEnabled && !signpostingEnabled;

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
        templateTitle: currentApplication?.forkedFromTemplateTitle,
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
        handlePublish();
      }
    },
    [dispatch, handlePublish],
  );

  //Fetch all users for the application to show the share button tooltip
  useEffect(() => {
    if (workspaceId) {
      dispatch(fetchUsersForWorkspace(workspaceId));
    }
  }, [workspaceId]);

  const isPrivateEmbedEnabled = useFeatureFlag(
    FEATURE_FLAG.license_private_embeds_enabled,
  );

  const isGACEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  return (
    <ThemeProvider theme={theme}>
      <HeaderWrapper
        className="pl-1 pr-1 overflow-hidden"
        data-testid="t--appsmith-editor-header"
      >
        <HeaderSection className="space-x-2">
          {showEntityExplorerLock ? (
            <LockEntityExplorer isPreviewingApp={isPreviewingApp} />
          ) : (
            <div />
          )}

          <AppsmithLink />

          <Tooltip
            content={createMessage(RENAME_APPLICATION_TOOLTIP)}
            isDisabled={isPopoverOpen}
            placement="bottom"
          >
            <div>
              <EditorName
                applicationId={applicationId}
                className="t--application-name editable-application-name max-w-48"
                defaultSavingState={
                  isSavingName ? SavingState.STARTED : SavingState.NOT_STARTED
                }
                defaultValue={currentApplication?.name || ""}
                editInteractionKind={EditInteractionKind.SINGLE}
                editorName="Application"
                fill
                getNavigationMenu={GetNavigationMenuData}
                isError={isErroredSavingName}
                isNewEditor={
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
          <EditorSaveIndicator isSaving={isSaving} saveError={pageSaveError} />
        </HeaderSection>

        <HelperBarInHeader />

        <HeaderSection className="gap-x-1">
          <Boxed
            alternative={<EndTour />}
            step={GUIDED_TOUR_STEPS.BUTTON_ONSUCCESS_BINDING}
          >
            <RealtimeAppEditors applicationId={applicationId} />
            <ToggleModeButton />
            {applicationId && <EditorShareButton setShowModal={setShowModal} />}
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
                            {createMessage(COMMUNITY_TEMPLATES.tabTitle)}
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
                  isDisabled={isProtectedMode}
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
        <Omnibar />
      </HeaderWrapper>
    </ThemeProvider>
  );
}

export default EditorHeader;
