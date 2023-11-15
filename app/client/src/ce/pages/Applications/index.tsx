import React, {
  Component,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import styled, { ThemeContext } from "styled-components";
import { connect, useDispatch, useSelector } from "react-redux";
import MediaQuery from "react-responsive";
import { useLocation } from "react-router-dom";
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
  getDeletingMultipleApps,
  getIsCreatingApplication,
  getIsDeletingApplication,
  getIsFetchingApplications,
  getIsSavingWorkspaceInfo,
  getUserApplicationsWorkspaces,
  getUserApplicationsWorkspacesList,
} from "@appsmith/selectors/applicationSelectors";
import type { ApplicationPayload } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import PageWrapper from "pages/common/PageWrapper";
import SubHeader from "pages/common/SubHeader";
import WorkspaceInviteUsersForm from "pages/workspace/WorkspaceInviteUsersForm";
import type { User } from "constants/userConstants";
import { getCurrentUser } from "selectors/usersSelectors";
import { CREATE_WORKSPACE_FORM_NAME } from "@appsmith/constants/forms";
import {
  AppIconCollection,
  Classes,
  EditableText,
  MenuItem as ListItem,
  Text,
  TextType,
} from "design-system-old";
import { Divider, Icon } from "design-system";
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
  createMessage,
  INVITE_USERS_PLACEHOLDER,
  NO_APPS_FOUND,
  SEARCH_APPS,
  WORKSPACES_HEADING,
} from "@appsmith/constants/messages";

import { setHeaderMeta } from "actions/themeActions";
import SharedUserList from "pages/common/SharedUserList";
import { useIsMobileDevice } from "utils/hooks/useDeviceDetect";
import { Indices } from "constants/Layers";
import GitSyncModal from "pages/Editor/gitSync/GitSyncModal";
import DisconnectGitModal from "pages/Editor/gitSync/DisconnectGitModal";
import ReconnectDatasourceModal from "pages/Editor/gitSync/ReconnectDatasourceModal";
import LeftPaneBottomSection from "pages/Home/LeftPaneBottomSection";
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
      ${(props) => (props.isBannerVisible ? "48px" : "0px")}
  );
  border-right: 1px solid var(--ads-v2-color-border);
  padding: 0 16px;
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
export const WorkspaceShareUsers = styled.div<{ isHidden?: boolean }>`
  display: flex;
  align-items: center;
  ${(props) => props.isHidden && "opacity: 0; visibility: hidden;"}

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
`;

export function LeftPaneSection(props: {
  heading: string;
  children?: any;
  isFetchingApplications: boolean;
  isBannerVisible?: boolean;
}) {
  return (
    <LeftPaneDataSection isBannerVisible={props.isBannerVisible}>
      <Item label={props.heading} textType={TextType.SIDE_HEAD} />
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
  isFetchingApplications,
  selected,
  workspace,
}: any) {
  const menuRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (selected) {
      menuRef.current?.scrollIntoView({ behavior: "smooth" });
      menuRef.current?.click();
    }
  }, [selected]);

  return (
    <ListItem
      containerClassName={
        isFetchingApplications ? BlueprintClasses.SKELETON : ""
      }
      ellipsize={
        isFetchingApplications ? 100 : 19
      } /* this is to avoid showing tooltip for loaders */
      href={`${window.location.pathname}#${workspace.workspace.id}`}
      icon="workspace"
      key={workspace.workspace.id}
      ref={menuRef}
      selected={selected}
      text={workspace.workspace.name}
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
}

export function LeftPane(props: LeftPaneProps) {
  const { isBannerVisible = false } = props;
  const dispatch = useDispatch();
  const fetchedUserWorkspaces = useSelector(getUserApplicationsWorkspaces);
  const isFetchingApplications = useSelector(getIsFetchingApplications);
  const isMobile = useIsMobileDevice();
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  let userWorkspaces;
  if (!isFetchingApplications) {
    userWorkspaces = fetchedUserWorkspaces;
  } else {
    userWorkspaces = loadingUserWorkspaces as any;
  }

  const tenantPermissions = useSelector(getTenantPermissions);
  const canCreateWorkspace = getHasCreateWorkspacePermission(
    isFeatureEnabled,
    tenantPermissions,
  );

  const location = useLocation();
  const urlHash = location.hash.slice(1);

  if (isMobile) return null;

  return (
    <LeftPaneWrapper isBannerVisible={isBannerVisible}>
      <LeftPaneSection
        heading={createMessage(WORKSPACES_HEADING)}
        isBannerVisible={isBannerVisible}
        isFetchingApplications={isFetchingApplications}
      >
        <WorkpsacesNavigator data-testid="t--left-panel">
          {canCreateWorkspace && (
            <ListItem
              color="var(--ads-v2-color-fg-emphasis)"
              data-testid="t--workspace-new-workspace-auto-create"
              icon="plus"
              onSelect={async () =>
                submitCreateWorkspaceForm(
                  {
                    name: getNextEntityName(
                      "Untitled workspace ",
                      fetchedUserWorkspaces.map((el: any) => el.workspace.name),
                    ),
                  },
                  dispatch,
                )
              }
              text={CREATE_WORKSPACE_FORM_NAME}
            />
          )}
          {userWorkspaces &&
            userWorkspaces.map((workspace: any) => (
              <WorkspaceMenuItem
                isFetchingApplications={isFetchingApplications}
                key={workspace.workspace.id}
                selected={urlHash === workspace.workspace.id}
                workspace={workspace}
              />
            ))}
        </WorkpsacesNavigator>
        <LeftPaneBottomSection />
      </LeftPaneSection>
    </LeftPaneWrapper>
  );
}

export const CreateNewLabel = styled(Text)`
  margin-top: 18px;
`;

export const WorkspaceNameElement = styled(Text)<{ isMobile?: boolean }>`
  max-width: ${({ isMobile }) => (isMobile ? 220 : 500)}px;
  ${truncateTextUsingEllipsis};
  color: var(--ads-v2-color-fg);
  font-weight: var(--ads-font-weight-bold-xl);
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

export const ApplicationsWrapper = styled.div<{ isMobile: boolean }>`
  height: calc(100vh - ${(props) => props.theme.homePage.search.height - 40}px);
  overflow: auto;
  margin-left: ${(props) => props.theme.homePage.leftPane.width}px;
  width: calc(100% - ${(props) => props.theme.homePage.leftPane.width}px);
  scroll-behavior: smooth;
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

export function ApplicationsSection(props: any) {
  const enableImportExport = true;
  const dispatch = useDispatch();
  const theme = useContext(ThemeContext);
  const { isFetchingPackages } = usePackage();
  const isSavingWorkspaceInfo = useSelector(getIsSavingWorkspaceInfo);
  const isFetchingApplications = useSelector(getIsFetchingApplications);
  const userWorkspaces = useSelector(getUserApplicationsWorkspacesList);
  const creatingApplicationMap = useSelector(getIsCreatingApplication);
  const currentUser = useSelector(getCurrentUser);
  const isMobile = useIsMobileDevice();
  const deleteMultipleApplicationObject = useSelector(getDeletingMultipleApps);
  const isEnabledMultipleSelection =
    !!deleteMultipleApplicationObject.list?.length;
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
  const isLoadingResources = isFetchingApplications || isFetchingPackages;
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
            type={TextType.H4}
          >
            {workspaceName}
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

  let updatedWorkspaces;
  if (!isLoadingResources) {
    updatedWorkspaces = userWorkspaces;
  } else {
    updatedWorkspaces = loadingUserWorkspaces as any;
  }

  let workspacesListComponent;
  if (
    !isLoadingResources &&
    props.searchKeyword &&
    props.searchKeyword.trim().length > 0 &&
    updatedWorkspaces.length === 0
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
    workspacesListComponent = updatedWorkspaces.map(
      (workspaceObject: any, index: number) => {
        const isLastWorkspace = updatedWorkspaces.length === index + 1;
        const { applications, packages, workflows, workspace } =
          workspaceObject;
        const hasManageWorkspacePermissions = isPermitted(
          workspace.userPermissions,
          PERMISSION_TYPE.MANAGE_WORKSPACE,
        );
        const canInviteToWorkspace = isPermitted(
          workspace.userPermissions,
          PERMISSION_TYPE.INVITE_USER_TO_WORKSPACE,
        );
        const canDeleteWorkspace = hasDeleteWorkspacePermission(
          workspace?.userPermissions || [],
        );
        const hasCreateNewApplicationPermission =
          hasCreateNewAppPermission(workspace.userPermissions) && !isMobile;

        const renderManageEnvironmentMenu =
          isManageEnvironmentEnabled &&
          hasManageWorkspaceEnvironmentPermission(workspace.userPermissions);

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
          hasCreateNewApplicationPermission ||
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

        return (
          <React.Fragment key={workspace.id}>
            <WorkspaceSection
              className="t--workspace-section"
              isMobile={isMobile}
              key={index}
            >
              <WorkspaceDropDown isMobile={isMobile}>
                {(currentUser || isLoadingResources) &&
                  WorkspaceMenuTarget({
                    workspaceName: workspace.name,
                    workspaceSlug: workspace.id,
                  })}
                {selectedWorkspaceIdForImportApplication && (
                  <ImportApplicationModal
                    isModalOpen={
                      selectedWorkspaceIdForImportApplication === workspace.id
                    }
                    onClose={() =>
                      setSelectedWorkspaceIdForImportApplication("")
                    }
                    workspaceId={selectedWorkspaceIdForImportApplication}
                  />
                )}
                {!isLoadingResources && (
                  <WorkspaceShareUsers isHidden={isEnabledMultipleSelection}>
                    <SharedUserList workspaceId={workspace.id} />
                    {canInviteToWorkspace && !isMobile && (
                      <FormDialogComponent
                        Form={WorkspaceInviteUsersForm}
                        placeholder={createMessage(
                          INVITE_USERS_PLACEHOLDER,
                          !isGACEnabled,
                        )}
                        workspace={workspace}
                      />
                    )}
                    <WorkspaceAction
                      isMobile={isMobile}
                      onCreateNewApplication={onClickAddNewAppButton}
                      workspaceId={workspace.id}
                    />
                    {(currentUser || isLoadingResources) &&
                      !isMobile &&
                      showWorkspaceMenuOptions && (
                        <WorkspaceMenu
                          canDeleteWorkspace={
                            applications.length === 0 &&
                            packages.length === 0 &&
                            canDeleteWorkspace
                          }
                          canInviteToWorkspace={canInviteToWorkspace}
                          enableImportExport={enableImportExport}
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
                          setSelectedWorkspaceIdForImportApplication={
                            setSelectedWorkspaceIdForImportApplication
                          }
                          setWarnDeleteWorkspace={setWarnDeleteWorkspace}
                          setWarnLeavingWorkspace={setWarnLeavingWorkspace}
                          setWorkspaceToOpenMenu={setWorkspaceToOpenMenu}
                          warnDeleteWorkspace={warnDeleteWorkspace}
                          warnLeavingWorkspace={warnLeavingWorkspace}
                          workspace={workspace}
                          workspaceNameChange={workspaceNameChange}
                          workspaceToOpenMenu={workspaceToOpenMenu}
                        />
                      )}
                  </WorkspaceShareUsers>
                )}
              </WorkspaceDropDown>
              {isLoadingResources && (
                <ResourceListLoader
                  isMobile={isMobile}
                  resources={applications}
                />
              )}
              {!isLoadingResources && (
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
                  workspaceId={workspace.id}
                />
              )}
              {!isLoadingResources && (
                <PackageCardList
                  isMobile={isMobile}
                  packages={packages}
                  workspaceId={workspace.id}
                />
              )}
              {!isLoadingResources && (
                <WorkflowCardList
                  isMobile={isMobile}
                  workflows={workflows}
                  workspaceId={workspace.id}
                />
              )}
            </WorkspaceSection>
            {!isLastWorkspace && <Divider />}
          </React.Fragment>
        );
      },
    );
  }

  return (
    <ApplicationContainer
      className="t--applications-container"
      isMobile={isMobile}
    >
      {workspacesListComponent}
      <>
        <GitSyncModal isImport />
        <DisconnectGitModal />
      </>
      <ReconnectDatasourceModal />
    </ApplicationContainer>
  );
}

export interface ApplicationProps {
  applicationList: ApplicationPayload[];
  searchApplications: (keyword: string) => void;
  isCreatingApplication: creatingApplicationMap;
  isFetchingApplications: boolean;
  createApplicationError?: string;
  deleteApplication: (id: string) => void;
  deletingApplication: boolean;
  getAllApplication: () => void;
  userWorkspaces: any;
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
    this.props.getAllApplication();
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
      <CreateNewAppsOption
        currentApplicationIdForCreateNewApp={
          this.props.currentApplicationIdForCreateNewApp
        }
        onClickBack={this.props.resetCurrentApplicationIdForCreateNewApp}
      />
    ) : (
      <PageWrapper displayName="Applications">
        <LeftPane />
        <MediaQuery maxWidth={MOBILE_MAX_WIDTH}>
          {(matches: boolean) => (
            <ApplicationsWrapper isMobile={matches}>
              <SubHeader
                search={{
                  placeholder: createMessage(SEARCH_APPS),
                  queryFn: this.props.searchApplications,
                  defaultValue: this.props.searchKeyword,
                }}
              />
              <ApplicationsSection searchKeyword={this.props.searchKeyword} />
              <RepoLimitExceededErrorModal />
            </ApplicationsWrapper>
          )}
        </MediaQuery>
      </PageWrapper>
    );
  }
}

export const mapStateToProps = (state: AppState) => ({
  applicationList: getApplicationList(state),
  isFetchingApplications: getIsFetchingApplications(state),
  isCreatingApplication: getIsCreatingApplication(state),
  createApplicationError: getCreateApplicationError(state),
  deletingApplication: getIsDeletingApplication(state),
  userWorkspaces: getUserApplicationsWorkspacesList(state),
  currentUser: getCurrentUser(state),
  searchKeyword: getApplicationSearchKeyword(state),
  currentApplicationIdForCreateNewApp:
    getCurrentApplicationIdForCreateNewApp(state),
});

export const mapDispatchToProps = (dispatch: any) => ({
  getAllApplication: () => {
    dispatch({ type: ReduxActionTypes.GET_ALL_APPLICATION_INIT });
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
