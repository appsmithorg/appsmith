import React, { Suspense, useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { APPLICATIONS_URL } from "constants/routes";
import {
  createMessage,
  DEPLOY_BUTTON_TOOLTIP,
  DEPLOY_MENU_OPTION,
  EDITOR_HEADER,
  IN_APP_EMBED_SETTING,
  INVITE_TAB,
  INVITE_USERS_PLACEHOLDER,
  LOGO_TOOLTIP,
  SHARE_BUTTON_TOOLTIP,
  SHARE_BUTTON_TOOLTIP_WITH_USER,
} from "@appsmith/constants/messages";
import AppsmithLogo from "assets/images/appsmith_logo_square.png";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Tab,
  TabPanel,
  Tabs,
  TabsList,
  Text,
  Tooltip,
} from "design-system";
import { useDispatch, useSelector } from "react-redux";
import {
  getApplicationList,
  getCurrentApplication,
  getIsErroredSavingAppName,
  getIsSavingAppName,
} from "@appsmith/selectors/applicationSelectors";
import {
  getAllUsers,
  getCurrentAppWorkspace,
  getCurrentWorkspaceId,
} from "@appsmith/selectors/workspaceSelectors";
import { fetchWorkspace } from "@appsmith/actions/workspaceActions";
import { EditInteractionKind, SavingState } from "design-system-old";
import EditorAppName from "pages/Editor/EditorAppName";
import {
  getCurrentApplicationId,
  getCurrentPageId,
  getIsPublishingApplication,
} from "selectors/editorSelectors";
import {
  publishApplication,
  updateApplication,
} from "@appsmith/actions/applicationActions";
import ToggleModeButton from "pages/Editor/ToggleModeButton";
import AppInviteUsersForm from "pages/workspace/AppInviteUsersForm";
import EmbedSnippetForm from "@appsmith/pages/Applications/EmbedSnippetTab";
import DeployLinkButtonDialog from "components/designSystems/appsmith/header/DeployLinkButton";
import { getCurrentUser } from "selectors/usersSelectors";
import { getAppsmithConfigs } from "@appsmith/configs";
import { useHref } from "pages/Editor/utils";
import { viewerURL } from "RouteBuilder";
import { showConnectGitModal } from "actions/gitSyncActions";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getUserPreferenceFromStorage } from "@appsmith/utils/Environments";
import { showEnvironmentDeployInfoModal } from "@appsmith/actions/environmentAction";
import { getIsGitConnected } from "selectors/gitSyncSelectors";
import { datasourceEnvEnabled } from "@appsmith/selectors/featureFlagsSelectors";
import type { NavigationSetting } from "constants/AppConstants";
import { EditorSaveIndicator } from "../Editor/EditorSaveIndicator";
import HelpBar from "../../components/editorComponents/GlobalSearch/HelpBar";
import GlobalSearch from "components/editorComponents/GlobalSearch";
import { useIDENavState } from "./hooks";
import PageSwitcher from "./PageState/PageSwitcher";
import { IDEAppState } from "./ideReducer";

const Header = styled.div`
  background-color: #f1f5f9;
  height: 40px;
  display: grid;
  grid-template-columns: 50px 1fr;
  grid-column-gap: 4px;
`;

const LogoContainer = styled.div`
  background-color: white;
  border-bottom-right-radius: 4px;
  display: grid;
  align-items: center;
  justify-content: center;
`;

const TopBarContainer = styled.div`
  background-color: white;
  border-bottom-right-radius: 4px;
  border-bottom-left-radius: 4px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
`;

const PaneTitle = styled.div`
  color: #364252;
  padding: 8px 12px;
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

const AppNameContainer = styled.div`
  display: flex;
  flex: 1;
  justify-content: center;
  #workspace-name {
    color: #6a7585;
    margin-right: 1px;
    align-self: center;
  }
`;

const EditorActionsContainer = styled.div`
  position: absolute;
  right: 0;
  top: 2px;
  display: flex;
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const Divider = styled.div`
  background-color: #cdd5df;
  width: 1px;
  height: 16px;
  margin: 0 10px;
`;

const { cloudHosting } = getAppsmithConfigs();

const IDEHeader = function () {
  const dispatch = useDispatch();

  const applicationId = useSelector(getCurrentApplicationId);
  const currentApplication = useSelector(getCurrentApplication);
  const workspaceId = useSelector(getCurrentWorkspaceId);
  const currentWorkspace = useSelector(getCurrentAppWorkspace);
  const isSavingName = useSelector(getIsSavingAppName);
  const isErroredSavingName = useSelector(getIsErroredSavingAppName);
  const applicationList = useSelector(getApplicationList);
  const sharedUserList = useSelector(getAllUsers);
  const currentUser = useSelector(getCurrentUser);
  const isPublishing = useSelector(getIsPublishingApplication);
  const pageId = useSelector(getCurrentPageId) as string;
  const isGitConnected = useSelector(getIsGitConnected);
  const dsEnvEnabled = useSelector(datasourceEnvEnabled);

  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("invite");
  const [navState] = useIDENavState();
  const { ideState } = navState;

  const deployLink = useHref(viewerURL, { pageId });
  let appStateTitle = null;
  switch (ideState) {
    case IDEAppState.Data: {
      appStateTitle = (
        <PaneTitle>
          <Text kind="heading-s">Datasources</Text>
        </PaneTitle>
      );
      break;
    }
    case IDEAppState.Page: {
      appStateTitle = <PageSwitcher />;
      break;
    }
    case IDEAppState.Add: {
      appStateTitle = (
        <PaneTitle>
          <Text kind="heading-s">Add new...</Text>
        </PaneTitle>
      );
      break;
    }
    case IDEAppState.Libraries: {
      appStateTitle = (
        <PaneTitle>
          <Text kind="heading-s">Libraries</Text>
        </PaneTitle>
      );
      break;
    }
    case IDEAppState.Settings: {
      appStateTitle = (
        <PaneTitle>
          <Text kind="heading-s">Settings</Text>
        </PaneTitle>
      );
      break;
    }
  }

  useEffect(() => {
    if (workspaceId) {
      dispatch(fetchWorkspace(workspaceId));
    }
  }, [workspaceId]);
  const updateApplicationDispatch = (
    id: string,
    data: { name: string; currentApp: boolean },
  ) => {
    dispatch(updateApplication(id, data));
  };
  const filteredSharedUserList = sharedUserList.filter(
    (user) => user.username !== currentUser?.username,
  );

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
        if (!dsEnvEnabled || getUserPreferenceFromStorage() === "true") {
          handlePublish();
        } else {
          dispatch(showEnvironmentDeployInfoModal());
        }
      }
    },
    [dispatch, handlePublish],
  );

  return (
    <Header id="IDE-header">
      <LogoContainer>
        <Tooltip content={createMessage(LOGO_TOOLTIP)} placement="bottomLeft">
          <AppsmithLink to={APPLICATIONS_URL}>
            <img
              alt="Appsmith logo"
              className="t--appsmith-logo"
              src={AppsmithLogo}
            />
          </AppsmithLink>
        </Tooltip>
      </LogoContainer>
      <TopBarContainer>
        {appStateTitle}
        {currentWorkspace.name && (
          <AppNameContainer>
            <span id="workspace-name">{currentWorkspace.name} / </span>
            <EditorAppName
              applicationId={currentApplication?.applicationId}
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
          </AppNameContainer>
        )}
        <EditorActionsContainer>
          <EditorSaveIndicator />
          <HelpBar />
          <Divider />
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
              <ModalHeader>Application Invite</ModalHeader>
              <ModalBody>
                <Tabs
                  onValueChange={(value) => setActiveTab(value)}
                  value={activeTab}
                >
                  <TabsList>
                    <Tab data-testid="t--tab-INVITE" value="invite">
                      {createMessage(INVITE_TAB)}
                    </Tab>
                    <Tab data-tesid="t--tab-EMBED" value="embed">
                      {createMessage(IN_APP_EMBED_SETTING.embed)}
                    </Tab>
                  </TabsList>
                  <TabPanel value="invite">
                    <AppInviteUsersForm
                      applicationId={applicationId}
                      placeholder={createMessage(
                        INVITE_USERS_PLACEHOLDER,
                        cloudHosting,
                      )}
                      workspaceId={workspaceId}
                    />
                  </TabPanel>
                  <TabPanel value="embed">
                    <EmbedSnippetForm
                      changeTab={() => setActiveTab("invite")}
                    />
                  </TabPanel>
                </Tabs>
              </ModalBody>
            </ModalContent>
          </Modal>
          <div className="flex items-center">
            <Tooltip
              content={createMessage(DEPLOY_BUTTON_TOOLTIP)}
              placement="bottomRight"
            >
              <Button
                className="t--application-publish-btn"
                data-guided-tour-iid="deploy"
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
        </EditorActionsContainer>
        <Suspense fallback={<span />}>
          <GlobalSearch />
        </Suspense>
      </TopBarContainer>
    </Header>
  );
};

export default IDEHeader;
