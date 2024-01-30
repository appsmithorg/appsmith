import React, {
  Component,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import styled, { ThemeContext } from "styled-components";
import { connect, useDispatch, useSelector } from "react-redux";
import MediaQuery from "react-responsive";
import { useHistory, useLocation, useRouteMatch } from "react-router-dom";
import type { AppState } from "@appsmith/reducers";
import { Classes as BlueprintClasses } from "@blueprintjs/core";
import {
  thinScrollbar,
  truncateTextUsingEllipsis,
} from "constants/DefaultTheme";
import {
  getApplicationList,
  getApplicationSearchKeyword,
  getCreateApplicationError,
  getCurrentApplicationIdForCreateNewApp,
  getIsCreatingApplication,
  getIsDeletingApplication,
} from "@appsmith/selectors/applicationSelectors";
import type { ApplicationPayload } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import PageWrapper from "pages/common/PageWrapper";
import WorkspaceInviteUsersForm from "pages/workspace/WorkspaceInviteUsersForm";
import type { User } from "constants/userConstants";
import { getCurrentUser } from "selectors/usersSelectors";
import {
  AppIconCollection,
  Classes,
  EditableText,
  MenuItem as ListItem,
  Text,
  TextType,
} from "design-system-old";
import {
  Button,
  Icon,
  Text as NewText,
  Option,
  Select,
  Tooltip,
} from "design-system";
import { updateApplication } from "@appsmith/actions/applicationActions";
import { Position } from "@blueprintjs/core/lib/esm/common/position";
import type { UpdateApplicationPayload } from "@appsmith/api/ApplicationApi";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { loadingUserWorkspaces } from "pages/Applications/ApplicationLoaders";
import type { creatingApplicationMap } from "@appsmith/reducers/uiReducers/applicationsReducer";
import {
  deleteWorkspace,
  fetchAllWorkspaces,
  fetchEntitiesOfWorkspace,
  resetCurrentWorkspace,
  saveWorkspace,
} from "@appsmith/actions/workspaceActions";
import { leaveWorkspace } from "actions/userActions";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import NoSearchImage from "assets/images/NoSearchResult.svg";
import { getNextEntityName, getRandomPaletteColor } from "utils/AppsmithUtils";
import { createWorkspaceSubmitHandler } from "@appsmith/pages/workspace/helpers";
import ImportApplicationModal from "pages/Applications/ImportApplicationModal";
import {
  CREATE_A_NEW_WORKSPACE,
  createMessage,
  INVITE_USERS_PLACEHOLDER,
  NO_APPS_FOUND,
  NO_WORKSPACE_DESCRIPTION,
  NO_WORKSPACE_HEADING,
  WORKSPACES_HEADING,
} from "@appsmith/constants/messages";

import { setHeaderMeta } from "actions/themeActions";
import SharedUserList from "pages/common/SharedUserList";
import { useIsMobileDevice } from "utils/hooks/useDeviceDetect";
import { Indices } from "constants/Layers";
import GitSyncModal from "pages/Editor/gitSync/GitSyncModal";
import ReconnectDatasourceModal from "pages/Editor/gitSync/ReconnectDatasourceModal";
import { MOBILE_MAX_WIDTH } from "constants/AppConstants";
import urlBuilder from "@appsmith/entities/URLRedirect/URLAssembly";
import RepoLimitExceededErrorModal from "pages/Editor/gitSync/RepoLimitExceededErrorModal";
import { resetEditorRequest } from "actions/initActions";
import {
  hasCreateNewAppPermission,
  hasDeleteWorkspacePermission,
  hasManageWorkspaceEnvironmentPermission,
  isPermitted,
  PERMISSION_TYPE,
} from "@appsmith/utils/permissionHelpers";
import { getTenantPermissions } from "@appsmith/selectors/tenantSelectors";
import { getAppsmithConfigs } from "@appsmith/configs";
import FormDialogComponent from "components/editorComponents/form/FormDialogComponent";
import WorkspaceMenu from "@appsmith/pages/Applications/WorkspaceMenu";
import ApplicationCardList from "@appsmith/pages/Applications/ApplicationCardList";
import { usePackage } from "@appsmith/pages/Applications/helpers";
import PackageCardList from "@appsmith/pages/Applications/PackageCardList";
import WorkspaceAction from "@appsmith/pages/Applications/WorkspaceAction";
import ResourceListLoader from "@appsmith/pages/Applications/ResourceListLoader";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { getHasCreateWorkspacePermission } from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import WorkflowCardList from "@appsmith/pages/Applications/WorkflowCardList";
import { allowManageEnvironmentAccessForUser } from "@appsmith/selectors/environmentSelectors";
import CreateNewAppsOption from "@appsmith/pages/Applications/CreateNewAppsOption";
import { resetCurrentApplicationIdForCreateNewApp } from "actions/onboardingActions";
import {
  getFetchedWorkspaces,
  getIsDeletingWorkspace,
  getIsFetchingWorkspaces,
  getIsSavingWorkspaceInfo,
} from "@appsmith/selectors/workspaceSelectors";
import type { Workspace } from "@appsmith/constants/workspaceConstants";
import { getPackagesList } from "@appsmith/selectors/packageSelectors";
import {
  getApplicationsOfWorkspace,
  getIsFetchingApplications,
  getCurrentWorkspaceId,
} from "@appsmith/selectors/selectedWorkspaceSelectors";
import { shouldShowLicenseBanner } from "@appsmith/selectors/tenantSelectors";
import { getWorkflowsList } from "@appsmith/selectors/workflowSelectors";

export const { cloudHosting } = getAppsmithConfigs();

export const CONTAINER_WRAPPER_PADDING = "var(--ads-v2-spaces-7)";

export const WorkspaceDropDown = styled.div<{ isMobile?: boolean }>`
  display: flex;
  padding: ${(props) => (props.isMobile ? `10px 16px` : `24px 0`)};
  font-size: ${(props) => props.theme.fontSizes[1]}px;
  justify-content: space-between;
  align-items: center;
  ${({ isMobile }) =>
    isMobile &&
    `
    background-color: #fff;
    z-index: ${Indices.Layer8};
  `}
`;

export const WorkspaceSection = styled.div<{ isMobile?: boolean }>`
  padding: ${({ isMobile }) =>
    isMobile ? 0 : `0 ${CONTAINER_WRAPPER_PADDING}`};
  margin-bottom: ${({ isMobile }) => (isMobile ? `8` : `0`)}px;
`;

export const LeftPaneWrapper = styled.div<{ isBannerVisible?: boolean }>`
  overflow: auto;
  width: ${(props) => props.theme.homePage.sidebar}px;
  height: ${(props) =>
    props.isBannerVisible
      ? `calc(100% - ${props.theme.homePage.header * 2}px)`
      : "100%"};
  display: flex;
  padding-top: 16px;
  flex-direction: column;
  position: fixed;
  top: calc(
    ${(props) => props.theme.homePage.header}px +
      ${(props) => (props.isBannerVisible ? 40 : 0)}px
  );
  border-right: 1px solid var(--ads-v2-color-border);
  padding: 0px 4px;
  margin: 0px 8px;
`;

export const ApplicationContainer = styled.div<{ isMobile?: boolean }>`
  ${({ isMobile }) =>
    isMobile &&
    `
    margin-left: 0;
    width: 100%;
    padding: 0;
  `}
`;

export const ItemWrapper = styled.div`
  padding: 16px;
`;
export const StyledIcon = styled(Icon)`
  margin-right: 11px;
`;
export const WorkspaceShareUsers = styled.div`
  display: flex;
  align-items: center;

  & .t--options-icon {
    margin-left: 8px;

    svg {
      path {
        fill: #090707;
      }
    }
  }

  & .t--new-button {
    margin-left: 8px;
  }
`;

export const NoAppsFound = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;

  & > span {
    margin-bottom: 24px;
  }
`;

export function Item(props: {
  label: string;
  textType: TextType;
  icon?: string;
  isFetchingApplications?: boolean;
}) {
  return (
    <ItemWrapper>
      {props.icon && <StyledIcon name={props.icon} />}
      <Text
        className={
          !!props.isFetchingApplications ? BlueprintClasses.SKELETON : ""
        }
        color={"var(--ads-v2-color-fg-emphasis)"}
        type={props.textType}
      >
        {" "}
        {props.label}
      </Text>
    </ItemWrapper>
  );
}

const LeftPaneDataSection = styled.div<{ isBannerVisible?: boolean }>`
  position: relative;
  height: calc(100vh - ${(props) => 48 + (props.isBannerVisible ? 48 : 0)}px);
  display: flex;
  flex-direction: column;
  button {
    height: 34px !important;
  }
`;

export function LeftPaneSection(props: {
  heading: string;
  children?: any;
  isFetchingWorkspaces: boolean;
  isBannerVisible?: boolean;
}) {
  const dispatch = useDispatch();
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const tenantPermissions = useSelector(getTenantPermissions);
  const fetchedWorkspaces = useSelector(getFetchedWorkspaces);

  const canCreateWorkspace = getHasCreateWorkspacePermission(
    isFeatureEnabled,
    tenantPermissions,
  );

  const createNewWorkspace = async () => {
    await submitCreateWorkspaceForm(
      {
        name: getNextEntityName(
          "Untitled workspace ",
          fetchedWorkspaces.map((el: any) => el.name),
        ),
      },
      dispatch,
    );
    dispatch(fetchAllWorkspaces());
  };

  return (
    <LeftPaneDataSection isBannerVisible={props.isBannerVisible}>
      <div className="flex items-center justify-between py-3">
        <NewText kind="heading-xs">{props.heading}</NewText>
        {canCreateWorkspace && (
          <Tooltip
            content={createMessage(CREATE_A_NEW_WORKSPACE)}
            placement="right"
          >
            <Button
              data-testid="t--workspace-new-workspace-auto-create"
              isDisabled={props.isFetchingWorkspaces}
              kind="tertiary"
              onClick={createNewWorkspace}
              startIcon="add-line"
            />
          </Tooltip>
        )}
      </div>
      {props.children}
    </LeftPaneDataSection>
  );
}

export const StyledAnchor = styled.a`
  position: relative;
  top: -24px;
`;

export const WorkpsacesNavigator = styled.div`
  overflow: auto;
  margin-bottom: 4px;
  ${thinScrollbar};
  .selected-workspace {
    border-radius: 4px !important;
    &:hover {
      background-color: var(--ads-v2-color-bg-muted);
    }
  }
`;

export const textIconStyles = (props: { color: string; hover: string }) => {
  return `
    &&&&&& {
      .${Classes.TEXT},.${Classes.ICON} svg path {
        color: ${props.color};
        stroke: ${props.color};
        fill: ${props.color};
      }


      &:hover {
        .${Classes.TEXT},.${Classes.ICON} svg path {
          color: ${props.hover};
          stroke: ${props.hover};
          fill: ${props.hover};
        }
      }
    }
  `;
};

export function WorkspaceMenuItem({
  isFetchingWorkspaces,
  selected,
  workspace,
}: any) {
  const history = useHistory();
  const location = useLocation();

  const handleWorkspaceClick = () => {
    const workspaceId = workspace?.id;
    if (workspaceId) {
      const newUrl = `${location.pathname}?workspaceId=${workspaceId}`;
      history.push(newUrl);
    }
  };

  if (!workspace.id) return null;
  return (
    <ListItem
      className={selected ? "selected-workspace" : ""}
      containerClassName={isFetchingWorkspaces ? BlueprintClasses.SKELETON : ""}
      ellipsize={
        isFetchingWorkspaces ? 100 : 22
      } /* this is to avoid showing tooltip for loaders */
      icon="group-2-line"
      key={workspace?.id}
      onSelect={handleWorkspaceClick}
      selected={selected}
      text={workspace?.name}
      tooltipPos={Position.BOTTOM_LEFT}
    />
  );
}

export const submitCreateWorkspaceForm = async (data: any, dispatch: any) => {
  const result = await createWorkspaceSubmitHandler(data, dispatch);
  return result;
};

export interface LeftPaneProps {
  isBannerVisible?: boolean;
  isFetchingWorkspaces: boolean;
  workspaces: any;
  activeWorkspaceId: string | undefined;
}

export function LeftPane(props: LeftPaneProps) {
  const {
    activeWorkspaceId,
    isBannerVisible = false,
    isFetchingWorkspaces,
    workspaces,
  } = props;
  const isMobile = useIsMobileDevice();

  if (isMobile) return null;
  return (
    <LeftPaneWrapper isBannerVisible={isBannerVisible}>
      <LeftPaneSection
        heading={createMessage(WORKSPACES_HEADING)}
        isBannerVisible={isBannerVisible}
        isFetchingWorkspaces={isFetchingWorkspaces}
      >
        <WorkpsacesNavigator data-testid="t--left-panel">
          {workspaces &&
            workspaces.map(
              (workspace: any) =>
                workspace && (
                  <WorkspaceMenuItem
                    isFetchingWorkspaces={isFetchingWorkspaces}
                    key={workspace?.id}
                    selected={workspace?.id === activeWorkspaceId}
                    workspace={workspace}
                  />
                ),
            )}
        </WorkpsacesNavigator>
      </LeftPaneSection>
    </LeftPaneWrapper>
  );
}

export const CreateNewLabel = styled(Text)`
  margin-top: 18px;
`;

export const WorkspaceNameElement = styled.div<{ isMobile?: boolean }>`
  max-width: ${({ isMobile }) => (isMobile ? 220 : 500)}px;
  ${truncateTextUsingEllipsis};
`;

export const WorkspaceNameHolder = styled(Text)`
  display: flex;
  align-items: center;
`;

export const WorkspaceNameWrapper = styled.div<{ disabled?: boolean }>`
  ${(props) => {
    const color = props.disabled
      ? props.theme.colors.applications.workspaceColor
      : props.theme.colors.applications.hover.workspaceColor[9];
    return `${textIconStyles({
      color: color,
      hover: color,
    })}`;
  }}
  .${Classes.ICON} {
    display: ${(props) => (!props.disabled ? "inline" : "none")};
    margin-left: 8px;
    color: ${(props) => props.theme.colors.applications.iconColor};
  }
`;
export const WorkspaceRename = styled(EditableText)`
  padding: 0 2px;
`;

export const NoSearchResultImg = styled.img`
  margin: 1em;
`;

export const ApplicationsWrapper = styled.div<{
  isMobile: boolean;
  isBannerVisible: boolean;
}>`
  height: calc(100vh - ${(props) => props.theme.homePage.search.height - 40}px);
  overflow: auto;
  margin-left: ${(props) => props.theme.homePage.leftPane.width}px;
  width: calc(100% - ${(props) => props.theme.homePage.leftPane.width}px);
  scroll-behavior: smooth;
  ${({ isBannerVisible }) => (isBannerVisible ? "margin-top: 48px;" : "")}
  ${({ isMobile }) =>
    isMobile
      ? `padding: ${CONTAINER_WRAPPER_PADDING} 0;`
      : `padding:  0 0 ${CONTAINER_WRAPPER_PADDING};`}

  ${({ isMobile }) =>
    isMobile &&
    `
    margin-left: 0;
    width: 100%;
    padding: 0;
  `}
`;

export const WorkspaceSelectorWrapper = styled.div`
  padding: 24px 10px 0;
`;

export function ApplicationsSection(props: any) {
  const { activeWorkspaceId, applications, packages, workflows, workspaces } =
    props;
  const enableImportExport = true;
  const dispatch = useDispatch();
  const theme = useContext(ThemeContext);
  const isSavingWorkspaceInfo = useSelector(getIsSavingWorkspaceInfo);
  const isFetchingWorkspaces = useSelector(getIsFetchingWorkspaces);
  const isFetchingApplications = useSelector(getIsFetchingApplications);
  const isDeletingWorkspace = useSelector(getIsDeletingWorkspace);
  const { isFetchingPackages } = usePackage();
  const creatingApplicationMap = useSelector(getIsCreatingApplication);
  const currentUser = useSelector(getCurrentUser);
  const isMobile = useIsMobileDevice();
  const deleteApplication = (applicationId: string) => {
    if (applicationId && applicationId.length > 0) {
      dispatch({
        type: ReduxActionTypes.DELETE_APPLICATION_INIT,
        payload: {
          applicationId,
        },
      });
    }
  };
  const [warnLeavingWorkspace, setWarnLeavingWorkspace] = useState(false);
  const [warnDeleteWorkspace, setWarnDeleteWorkspace] = useState(false);
  const [workspaceToOpenMenu, setWorkspaceToOpenMenu] = useState<string | null>(
    null,
  );
  const isManageEnvironmentEnabled = useSelector(
    allowManageEnvironmentAccessForUser,
  );
  const updateApplicationDispatch = (
    id: string,
    data: UpdateApplicationPayload,
  ) => {
    dispatch(updateApplication(id, data));
  };
  const isLoadingResources =
    isFetchingWorkspaces || isFetchingApplications || isFetchingPackages;
  const isGACEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  useEffect(() => {
    // Clears URL params cache
    urlBuilder.resetURLParams();
  }, []);

  const [
    selectedWorkspaceIdForImportApplication,
    setSelectedWorkspaceIdForImportApplication,
  ] = useState<string | undefined>();

  const leaveWS = (workspaceId: string) => {
    setWarnLeavingWorkspace(false);
    setWorkspaceToOpenMenu(null);
    dispatch(leaveWorkspace(workspaceId));
  };

  const handleDeleteWorkspace = useCallback(
    (workspaceId: string) => {
      setWarnDeleteWorkspace(false);
      setWorkspaceToOpenMenu(null);
      dispatch(deleteWorkspace(workspaceId));
    },
    [dispatch],
  );

  const workspaceNameChange = (newName: string, workspaceId: string) => {
    dispatch(
      saveWorkspace({
        id: workspaceId as string,
        name: newName,
      }),
    );
  };

  function WorkspaceMenuTarget(props: {
    workspaceName: string;
    disabled?: boolean;
    workspaceSlug: string;
  }) {
    const { disabled, workspaceName, workspaceSlug } = props;

    return (
      <WorkspaceNameWrapper
        className="t--workspace-name-text"
        disabled={disabled}
      >
        <StyledAnchor id={workspaceSlug} />
        <WorkspaceNameHolder
          className={isLoadingResources ? BlueprintClasses.SKELETON : ""}
          type={TextType.H4}
        >
          <WorkspaceNameElement
            className={isLoadingResources ? BlueprintClasses.SKELETON : ""}
            isMobile={isMobile}
          >
            <NewText className="!font-semibold" kind="heading-l">
              {workspaceName}
            </NewText>
          </WorkspaceNameElement>
        </WorkspaceNameHolder>
      </WorkspaceNameWrapper>
    );
  }

  const createNewApplication = (
    applicationName: string,
    workspaceId: string,
  ) => {
    const color = getRandomPaletteColor(theme.colors.appCardColors);
    const icon =
      AppIconCollection[Math.floor(Math.random() * AppIconCollection.length)];

    return dispatch({
      type: ReduxActionTypes.CREATE_APPLICATION_INIT,
      payload: {
        applicationName,
        workspaceId,
        icon,
        color,
      },
    });
  };

  function NoWorkspaceFound() {
    return (
      <div className="flex flex-col items-center justify-center mt-[180px]">
        <img
          className="mb-6"
          src="https://assets.appsmith.com/no-workspace-found.svg"
        />
        <NewText className="!mb-3 !font-semibold" kind="heading-s">
          {createMessage(NO_WORKSPACE_HEADING)}
        </NewText>
        <NewText className="w-[328px]" kind="heading-xs">
          {createMessage(NO_WORKSPACE_DESCRIPTION)}
        </NewText>
      </div>
    );
  }

  const activeWorkspace = workspaces.find(
    (workspace: Workspace) => workspace.id === activeWorkspaceId,
  );
  if (!activeWorkspace && !isFetchingWorkspaces) return <NoWorkspaceFound />;

  if (!activeWorkspace) return null;

  let workspacesListComponent;
  if (
    !isLoadingResources &&
    props.searchKeyword &&
    props.searchKeyword.trim().length > 0 &&
    workspaces?.length === 0
  ) {
    workspacesListComponent = (
      <CenteredWrapper
        style={{
          flexDirection: "column",
          position: "static",
        }}
      >
        <CreateNewLabel type={TextType.H4}>
          {createMessage(NO_APPS_FOUND)}
        </CreateNewLabel>
        <NoSearchResultImg alt="No result found" src={NoSearchImage} />
      </CenteredWrapper>
    );
  } else {
    const hasManageWorkspacePermissions = isPermitted(
      activeWorkspace.userPermissions,
      PERMISSION_TYPE.MANAGE_WORKSPACE,
    );
    const canInviteToWorkspace = isPermitted(
      activeWorkspace.userPermissions,
      PERMISSION_TYPE.INVITE_USER_TO_WORKSPACE,
    );
    const canDeleteWorkspace = hasDeleteWorkspacePermission(
      activeWorkspace?.userPermissions || [],
    );
    const hasCreateNewApplicationPermission =
      hasCreateNewAppPermission(activeWorkspace.userPermissions) && !isMobile;
    const renderManageEnvironmentMenu =
      isManageEnvironmentEnabled &&
      hasManageWorkspaceEnvironmentPermission(activeWorkspace.userPermissions);
    const onClickAddNewAppButton = (workspaceId: string) => {
      if (
        Object.entries(creatingApplicationMap).length === 0 ||
        (creatingApplicationMap && !creatingApplicationMap[workspaceId])
      ) {
        createNewApplication(
          getNextEntityName(
            "Untitled application ",
            applications.map((el: any) => el.name),
          ),
          workspaceId,
        );
      }
    };

    const showWorkspaceMenuOptions =
      canInviteToWorkspace ||
      hasManageWorkspacePermissions ||
      (canDeleteWorkspace && applications.length === 0) ||
      renderManageEnvironmentMenu;

    const handleResetMenuState = () => {
      setWorkspaceToOpenMenu(null);
      setWarnLeavingWorkspace(false);
      setWarnDeleteWorkspace(false);
    };

    const handleWorkspaceMenuClose = (open: boolean) => {
      if (!open && !warnLeavingWorkspace && !warnDeleteWorkspace) {
        handleResetMenuState();
      }
    };

    workspacesListComponent = (
      <React.Fragment key={activeWorkspace.id}>
        <WorkspaceSection className="t--workspace-section" isMobile={isMobile}>
          <WorkspaceDropDown isMobile={isMobile}>
            {(currentUser || isLoadingResources) &&
              WorkspaceMenuTarget({
                workspaceName: activeWorkspace.name,
                workspaceSlug: activeWorkspace.id,
              })}
            {selectedWorkspaceIdForImportApplication && (
              <ImportApplicationModal
                isModalOpen={
                  selectedWorkspaceIdForImportApplication === activeWorkspace.id
                }
                onClose={() => setSelectedWorkspaceIdForImportApplication("")}
                workspaceId={selectedWorkspaceIdForImportApplication}
              />
            )}
            {!isLoadingResources && (
              <WorkspaceShareUsers>
                <SharedUserList />
                {canInviteToWorkspace && !isMobile && (
                  <FormDialogComponent
                    Form={WorkspaceInviteUsersForm}
                    placeholder={createMessage(
                      INVITE_USERS_PLACEHOLDER,
                      !isGACEnabled,
                    )}
                    workspace={activeWorkspace}
                  />
                )}
                <WorkspaceAction
                  enableImportExport={enableImportExport}
                  isMobile={isMobile}
                  onCreateNewApplication={onClickAddNewAppButton}
                  setSelectedWorkspaceIdForImportApplication={
                    setSelectedWorkspaceIdForImportApplication
                  }
                  workspace={activeWorkspace}
                  workspaceId={activeWorkspaceId}
                />
                {(currentUser || isLoadingResources) &&
                  !isMobile &&
                  showWorkspaceMenuOptions && (
                    <WorkspaceMenu
                      canDeleteWorkspace={
                        applications.length === 0 &&
                        packages.length === 0 &&
                        workflows.length === 0 &&
                        canDeleteWorkspace
                      }
                      canInviteToWorkspace={canInviteToWorkspace}
                      handleDeleteWorkspace={handleDeleteWorkspace}
                      handleResetMenuState={handleResetMenuState}
                      handleWorkspaceMenuClose={handleWorkspaceMenuClose}
                      hasCreateNewApplicationPermission={
                        hasCreateNewApplicationPermission
                      }
                      hasManageWorkspacePermissions={
                        hasManageWorkspacePermissions
                      }
                      isFetchingResources={isLoadingResources}
                      isSavingWorkspaceInfo={isSavingWorkspaceInfo}
                      leaveWS={leaveWS}
                      setWarnDeleteWorkspace={setWarnDeleteWorkspace}
                      setWarnLeavingWorkspace={setWarnLeavingWorkspace}
                      setWorkspaceToOpenMenu={setWorkspaceToOpenMenu}
                      warnDeleteWorkspace={warnDeleteWorkspace}
                      warnLeavingWorkspace={warnLeavingWorkspace}
                      workspace={activeWorkspace}
                      workspaceNameChange={workspaceNameChange}
                      workspaceToOpenMenu={workspaceToOpenMenu}
                    />
                  )}
              </WorkspaceShareUsers>
            )}
          </WorkspaceDropDown>
          {isLoadingResources || isDeletingWorkspace ? (
            <ResourceListLoader isMobile={isMobile} resources={applications} />
          ) : (
            <>
              <ApplicationCardList
                applications={applications}
                canInviteToWorkspace={canInviteToWorkspace}
                deleteApplication={deleteApplication}
                enableImportExport={enableImportExport}
                hasCreateNewApplicationPermission={
                  hasCreateNewApplicationPermission
                }
                hasManageWorkspacePermissions={hasManageWorkspacePermissions}
                isMobile={isMobile}
                onClickAddNewButton={onClickAddNewAppButton}
                updateApplicationDispatch={updateApplicationDispatch}
                workspaceId={activeWorkspace.id}
              />
              <PackageCardList
                isMobile={isMobile}
                packages={packages}
                workspace={activeWorkspace}
                workspaceId={activeWorkspace.id}
              />
              <WorkflowCardList
                isMobile={isMobile}
                workflows={workflows}
                workspace={activeWorkspace}
                workspaceId={activeWorkspace.id}
              />
            </>
          )}
        </WorkspaceSection>
      </React.Fragment>
    );
  }

  return (
    <ApplicationContainer
      className="t--applications-container"
      isMobile={isMobile}
    >
      {workspacesListComponent}
      <GitSyncModal isImport />
      <ReconnectDatasourceModal />
    </ApplicationContainer>
  );
}

export const ApplictionsMainPage = (props: any) => {
  const { searchKeyword } = props;
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const workspaceIdFromQueryParams = urlParams.get("workspaceId");
  const dispatch = useDispatch();
  const history = useHistory();
  const isFetchingWorkspaces = useSelector(getIsFetchingWorkspaces);
  const fetchedWorkspaces = useSelector(getFetchedWorkspaces);
  const fetchedApplications = useSelector(getApplicationsOfWorkspace);
  const fetchedPackages = useSelector(getPackagesList);
  const fetchedWorkflows = useSelector(getWorkflowsList);
  const fetchedWorkspaceId = useSelector(getCurrentWorkspaceId);
  const showBanner = useSelector(shouldShowLicenseBanner);
  const isHomePage = useRouteMatch("/applications")?.isExact;
  const isLicensePage = useRouteMatch("/license")?.isExact;
  const isBannerVisible = showBanner && (isHomePage || isLicensePage);

  let workspaces: any;
  if (!isFetchingWorkspaces) {
    workspaces = fetchedWorkspaces;
  } else {
    workspaces = loadingUserWorkspaces as any;
  }

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<
    string | undefined
  >(
    workspaceIdFromQueryParams ? workspaceIdFromQueryParams : workspaces[0]?.id,
  );

  useEffect(() => {
    setActiveWorkspaceId(
      workspaceIdFromQueryParams
        ? workspaceIdFromQueryParams
        : workspaces[0]?.id,
    );
    if (
      activeWorkspaceId &&
      fetchedWorkspaceId &&
      fetchedWorkspaceId !== activeWorkspaceId
    ) {
      const activeWorkspace: Workspace = workspaces.find(
        (workspace: Workspace) => workspace.id === activeWorkspaceId,
      );
      if (activeWorkspace) {
        dispatch({
          type: ReduxActionTypes.SET_CURRENT_WORKSPACE,
          payload: { ...activeWorkspace },
        });
        dispatch(
          fetchEntitiesOfWorkspace({
            workspaceId: activeWorkspaceId,
          }),
        );
      }
    }
  }, [workspaceIdFromQueryParams, fetchedWorkspaces, activeWorkspaceId]);

  const packagesOfWorkspace = activeWorkspaceId
    ? fetchedPackages.filter((pkg) => pkg.workspaceId === activeWorkspaceId)
    : [];

  const workflowsOfWorkspace = activeWorkspaceId
    ? fetchedWorkflows.filter(
        (workflow) => workflow.workspaceId === activeWorkspaceId,
      )
    : [];

  return (
    <PageWrapper displayName="Applications">
      <LeftPane
        activeWorkspaceId={activeWorkspaceId}
        isBannerVisible={isBannerVisible}
        isFetchingWorkspaces={isFetchingWorkspaces}
        workspaces={workspaces}
      />
      <MediaQuery maxWidth={MOBILE_MAX_WIDTH}>
        {(matches: boolean) => (
          <ApplicationsWrapper
            isBannerVisible={!!isBannerVisible}
            isMobile={matches}
          >
            {!isFetchingWorkspaces && matches && (
              <WorkspaceSelectorWrapper>
                <Select
                  onSelect={(val) =>
                    history.push(`/applications?workspaceId=${val}`)
                  }
                  value={activeWorkspaceId}
                >
                  {workspaces.map((workspace: Workspace) => (
                    <Option key={workspace.id} value={workspace.id}>
                      {workspace.name}
                    </Option>
                  ))}
                </Select>
              </WorkspaceSelectorWrapper>
            )}
            <ApplicationsSection
              activeWorkspaceId={activeWorkspaceId}
              applications={fetchedApplications}
              packages={packagesOfWorkspace}
              searchKeyword={searchKeyword}
              workflows={workflowsOfWorkspace}
              workspaces={workspaces}
            />
            <RepoLimitExceededErrorModal />
          </ApplicationsWrapper>
        )}
      </MediaQuery>
    </PageWrapper>
  );
};

export interface ApplicationProps {
  applicationList: ApplicationPayload[];
  searchApplications: (keyword: string) => void;
  isCreatingApplication: creatingApplicationMap;
  isFetchingApplications: boolean;
  createApplicationError?: string;
  deleteApplication: (id: string) => void;
  deletingApplication: boolean;
  getAllWorkspaces: (params: {
    fetchEntities: boolean;
    workspaceId: string | null;
  }) => void;
  workspaces: any;
  currentUser?: User;
  searchKeyword: string | undefined;
  setHeaderMetaData: (
    hideHeaderShadow: boolean,
    showHeaderSeparator: boolean,
  ) => void;
  resetEditor: () => void;
  queryModuleFeatureFlagEnabled: boolean;
  resetCurrentWorkspace: () => void;
  currentApplicationIdForCreateNewApp?: string;
  resetCurrentApplicationIdForCreateNewApp: () => void;
  currentWorkspaceId: string;
}

export interface ApplicationState {
  selectedWorkspaceId: string;
  showOnboardingForm: boolean;
}

export class Applications<
  Props extends ApplicationProps,
  State extends ApplicationState,
> extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      selectedWorkspaceId: "",
      showOnboardingForm: false,
    } as State;
  }

  componentDidMount() {
    PerformanceTracker.stopTracking(PerformanceTransactionName.LOGIN_CLICK);
    PerformanceTracker.stopTracking(PerformanceTransactionName.SIGN_UP);
    const urlParams = new URLSearchParams(window.location.search);
    const workspaceIdFromQueryParams = urlParams.get("workspaceId");
    this.props.getAllWorkspaces({
      workspaceId: workspaceIdFromQueryParams,
      fetchEntities: true,
    });
    this.props.setHeaderMetaData(true, true);

    // Whenever we go back to home page from application page,
    // we should reset current workspace, as this workspace is not in context anymore
    this.props.resetCurrentWorkspace();
  }

  componentWillUnmount() {
    this.props.setHeaderMetaData(false, false);
    this.props.searchApplications("");
  }

  public render() {
    return this.props.currentApplicationIdForCreateNewApp ? (
      // Workspace id condition is added to ensure that we have workspace id present before we show 3 options
      // as workspace id is required to fetch plugins
      !!this.props.currentWorkspaceId ? (
        <CreateNewAppsOption
          currentApplicationIdForCreateNewApp={
            this.props.currentApplicationIdForCreateNewApp
          }
          onClickBack={this.props.resetCurrentApplicationIdForCreateNewApp}
        />
      ) : null
    ) : (
      <ApplictionsMainPage
        searchApplications={this.props.searchApplications}
        searchKeyword={this.props.searchKeyword}
      />
    );
  }
}

export const mapStateToProps = (state: AppState) => ({
  applicationList: getApplicationList(state),
  isFetchingApplications: getIsFetchingApplications(state),
  isCreatingApplication: getIsCreatingApplication(state),
  createApplicationError: getCreateApplicationError(state),
  deletingApplication: getIsDeletingApplication(state),
  workspaces: getFetchedWorkspaces(state),
  currentUser: getCurrentUser(state),
  searchKeyword: getApplicationSearchKeyword(state),
  currentApplicationIdForCreateNewApp:
    getCurrentApplicationIdForCreateNewApp(state),
  currentWorkspaceId: getCurrentWorkspaceId(state),
});

export const mapDispatchToProps = (dispatch: any) => ({
  getAllWorkspaces: ({
    fetchEntities,
    workspaceId,
  }: {
    fetchEntities: boolean;
    workspaceId: string | null;
  }) => {
    dispatch(fetchAllWorkspaces({ workspaceId, fetchEntities }));
  },
  resetEditor: () => {
    dispatch(resetEditorRequest());
  },
  searchApplications: (keyword: string) => {
    dispatch({
      type: ReduxActionTypes.SEARCH_APPLICATIONS,
      payload: {
        keyword,
      },
    });
  },
  setHeaderMetaData: (
    hideHeaderShadow: boolean,
    showHeaderSeparator: boolean,
  ) => {
    dispatch(setHeaderMeta(hideHeaderShadow, showHeaderSeparator));
  },
  resetCurrentWorkspace: () => dispatch(resetCurrentWorkspace()),
  resetCurrentApplicationIdForCreateNewApp: () =>
    dispatch(resetCurrentApplicationIdForCreateNewApp()),
});

export default connect(mapStateToProps, mapDispatchToProps)(Applications);
