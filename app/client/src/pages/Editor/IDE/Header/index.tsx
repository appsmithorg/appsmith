import React, { useCallback, useState } from "react";
import {
  Flex,
  Tooltip,
  Divider,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Tabs,
  TabsList,
  Tab,
  TabPanel,
  Button,
  Link,
} from "@appsmith/ads";
import { useDispatch, useSelector } from "react-redux";
import { EditInteractionKind, SavingState } from "@appsmith/ads-old";
import styled from "styled-components";

import {
  APPLICATION_INVITE,
  COMMUNITY_TEMPLATES,
  createMessage,
  DEPLOY_BUTTON_TOOLTIP,
  DEPLOY_MENU_OPTION,
  IN_APP_EMBED_SETTING,
  INVITE_TAB,
  HEADER_TITLES,
} from "ee/constants/messages";
import EditorName from "pages/Editor/EditorName";
import {
  getCurrentApplicationId,
  getCurrentPageId,
  getIsPageSaving,
  getIsPublishingApplication,
  getPageById,
  getPageSavingError,
} from "selectors/editorSelectors";
import {
  getApplicationList,
  getCurrentApplication,
  getIsErroredSavingAppName,
  getIsSavingAppName,
} from "ee/selectors/applicationSelectors";
import {
  publishApplication,
  updateApplication,
} from "ee/actions/applicationActions";
import { getCurrentAppWorkspace } from "ee/selectors/selectedWorkspaceSelectors";
import { Omnibar } from "pages/Editor/commons/Omnibar";
import ToggleModeButton from "pages/Editor/ToggleModeButton";
import { EditorShareButton } from "pages/Editor/EditorShareButton";
import AppInviteUsersForm from "pages/workspace/AppInviteUsersForm";
import { getEmbedSnippetForm } from "ee/utils/BusinessFeatures/privateEmbedHelpers";
import CommunityTemplatesPublishInfo from "pages/Editor/CommunityTemplates/Modals/CommunityTemplatesPublishInfo";
import PublishCommunityTemplateModal from "pages/Editor/CommunityTemplates/Modals/PublishCommunityTemplate";
import DeployLinkButtonDialog from "components/designSystems/appsmith/header/DeployLinkButton";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { getAppsmithConfigs } from "ee/configs";
import {
  getIsGitConnected,
  protectedModeSelector,
} from "selectors/gitSyncSelectors";
import { showConnectGitModal } from "actions/gitSyncActions";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import type { NavigationSetting } from "constants/AppConstants";
import { useHref } from "pages/Editor/utils";
import { viewerURL } from "ee/RouteBuilder";
import HelpBar from "components/editorComponents/GlobalSearch/HelpBar";
import { EditorTitle } from "./EditorTitle";
import { useCurrentAppState } from "../hooks/useCurrentAppState";
import { EditorState } from "ee/entities/IDE/constants";
import { EditorSaveIndicator } from "pages/Editor/EditorSaveIndicator";
import type { Page } from "entities/Page";
import { IDEHeader, IDEHeaderTitle } from "IDE";
import { APPLICATIONS_URL } from "constants/routes";
import { useNavigationMenuData } from "../../EditorName/useNavigationMenuData";
import useLibraryHeaderTitle from "ee/pages/Editor/IDE/Header/useLibraryHeaderTitle";

const StyledDivider = styled(Divider)`
  height: 50%;
  margin-left: 8px;
  margin-right: 8px;
`;

const { cloudHosting } = getAppsmithConfigs();

interface HeaderTitleProps {
  appState: EditorState;
  currentPage?: Page;
}

const HeaderTitleComponent = ({ appState, currentPage }: HeaderTitleProps) => {
  const libraryHeaderTitle = useLibraryHeaderTitle();

  switch (appState) {
    case EditorState.DATA:
      return (
        <IDEHeaderTitle
          key={appState}
          title={createMessage(HEADER_TITLES.DATA)}
        />
      );
    case EditorState.EDITOR:
      return <EditorTitle key={appState} title={currentPage?.pageName || ""} />;
    case EditorState.SETTINGS:
      return (
        <IDEHeaderTitle
          key={appState}
          title={createMessage(HEADER_TITLES.SETTINGS)}
        />
      );
    case EditorState.LIBRARIES:
      return <IDEHeaderTitle key={appState} title={libraryHeaderTitle} />;
    default:
      return <EditorTitle key={appState} title={currentPage?.pageName || ""} />;
  }
};

const Header = () => {
  const dispatch = useDispatch();

  // selectors
  const currentWorkspace = useSelector(getCurrentAppWorkspace);
  const applicationId = useSelector(getCurrentApplicationId);
  const isSavingName = useSelector(getIsSavingAppName);
  const currentApplication = useSelector(getCurrentApplication);
  const isErroredSavingName = useSelector(getIsErroredSavingAppName);
  const applicationList = useSelector(getApplicationList);
  const isProtectedMode = useSelector(protectedModeSelector);
  const isPublishing = useSelector(getIsPublishingApplication);
  const isGitConnected = useSelector(getIsGitConnected);
  const pageId = useSelector(getCurrentPageId) as string;
  const currentPage = useSelector(getPageById(pageId));
  const appState = useCurrentAppState();
  const isSaving = useSelector(getIsPageSaving);
  const pageSaveError = useSelector(getPageSavingError);

  // states
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("invite");
  const [
    showPublishCommunityTemplateModal,
    setShowPublishCommunityTemplateModal,
  ] = useState<boolean>(false);

  // feature flags
  const isGACEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const isPublishAppToCommunityEnabled = useFeatureFlag(
    FEATURE_FLAG.release_show_publish_app_to_community_enabled,
  );
  const isPrivateEmbedEnabled = useFeatureFlag(
    FEATURE_FLAG.license_private_embeds_enabled,
  );

  const deployLink = useHref(viewerURL, {
    basePageId: currentPage?.basePageId,
  });

  const updateApplicationDispatch = (
    id: string,
    data: { name: string; currentApp: boolean },
  ) => {
    dispatch(updateApplication(id, data));
  };

  const handlePublish = useCallback(() => {
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
  }, [applicationId, currentApplication, dispatch]);

  const handleClickDeploy = useCallback(() => {
    if (isGitConnected) {
      dispatch(showConnectGitModal());
      AnalyticsUtil.logEvent("GS_DEPLOY_GIT_CLICK", {
        source: "Deploy button",
      });
    } else {
      handlePublish();
    }
  }, [dispatch, handlePublish, isGitConnected]);

  return (
    <>
      <IDEHeader>
        <IDEHeader.Left>
          <HeaderTitleComponent appState={appState} currentPage={currentPage} />
          <EditorSaveIndicator isSaving={isSaving} saveError={pageSaveError} />
        </IDEHeader.Left>
        <IDEHeader.Center>
          <Flex alignItems={"center"}>
            {currentWorkspace.name && (
              <>
                <Link className="mr-1.5" to={APPLICATIONS_URL}>
                  {currentWorkspace.name}
                </Link>
                {"/"}
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
                  getNavigationMenu={useNavigationMenuData}
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
              </>
            )}
          </Flex>
        </IDEHeader.Center>
        <IDEHeader.Right>
          <HelpBar />
          <StyledDivider orientation={"vertical"} />
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
                    {isPublishAppToCommunityEnabled && cloudHosting && (
                      <Tab data-testid="t--tab-PUBLISH" value="publish">
                        {createMessage(COMMUNITY_TEMPLATES.tabTitle)}
                      </Tab>
                    )}
                  </TabsList>
                  <TabPanel value="invite">
                    <AppInviteUsersForm
                      applicationId={applicationId}
                      workspaceId={currentWorkspace.id}
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
                onClick={handleClickDeploy}
                size="md"
                startIcon={"rocket"}
              >
                {DEPLOY_MENU_OPTION()}
              </Button>
            </Tooltip>

            <DeployLinkButtonDialog link={deployLink} trigger="" />
          </div>
        </IDEHeader.Right>
      </IDEHeader>
      <Omnibar />
    </>
  );
};

export { Header };
