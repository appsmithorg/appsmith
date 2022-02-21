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
import { useLocation } from "react-router-dom";
import { AppState } from "reducers";
import { Classes as BlueprintClasses } from "@blueprintjs/core";
import {
  thinScrollbar,
  truncateTextUsingEllipsis,
} from "constants/DefaultTheme";
import {
  getApplicationList,
  getApplicationSearchKeyword,
  getCreateApplicationError,
  getIsCreatingApplication,
  getIsDeletingApplication,
  getIsDuplicatingApplication,
  getIsFetchingApplications,
  getIsSavingOrgInfo,
  getUserApplicationsOrgs,
  getUserApplicationsOrgsList,
} from "selectors/applicationSelectors";
import {
  ApplicationPayload,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import PageWrapper from "pages/common/PageWrapper";
import SubHeader from "pages/common/SubHeader";
import ApplicationCard from "./ApplicationCard";
import OrgInviteUsersForm from "pages/organization/OrgInviteUsersForm";
import { isPermitted, PERMISSION_TYPE } from "./permissionHelpers";
import FormDialogComponent from "components/editorComponents/form/FormDialogComponent";
import Dialog from "components/ads/DialogComponent";
// import OnboardingHelper from "components/editorComponents/Onboarding/Helper";
import { User } from "constants/userConstants";
import { getCurrentUser } from "selectors/usersSelectors";
import { CREATE_ORGANIZATION_FORM_NAME } from "constants/forms";
import {
  DropdownOnSelectActions,
  getOnSelectAction,
} from "pages/common/CustomizedDropdown/dropdownHelpers";
import Button, { Size, Category } from "components/ads/Button";
import Text, { TextType } from "components/ads/Text";
import Icon, { IconName, IconSize } from "components/ads/Icon";
import MenuItem from "components/ads/MenuItem";
import {
  duplicateApplication,
  updateApplication,
} from "actions/applicationActions";
import { onboardingCreateApplication } from "actions/onboardingActions";
import { Classes } from "components/ads/common";
import Menu from "components/ads/Menu";
import { Position } from "@blueprintjs/core/lib/esm/common/position";
import { UpdateApplicationPayload } from "api/ApplicationApi";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { loadingUserOrgs } from "./ApplicationLoaders";
import { creatingApplicationMap } from "reducers/uiReducers/applicationsReducer";
import EditableText, {
  EditInteractionKind,
  SavingState,
} from "components/ads/EditableText";
import { notEmptyValidator } from "components/ads/TextInput";
import { deleteOrg, saveOrg } from "actions/orgActions";
import { leaveOrganization } from "actions/userActions";
import CenteredWrapper from "../../components/designSystems/appsmith/CenteredWrapper";
import NoSearchImage from "../../assets/images/NoSearchResult.svg";
import { getNextEntityName, getRandomPaletteColor } from "utils/AppsmithUtils";
import { AppIconCollection } from "components/ads/AppIcon";
import ProductUpdatesModal from "pages/Applications/ProductUpdatesModal";
import { createOrganizationSubmitHandler } from "../organization/helpers";
import ImportApplicationModal from "./ImportApplicationModal";
import ImportAppViaGitModal from "pages/Editor/gitSync/ImportAppViaGitModal";
import {
  createMessage,
  DOCUMENTATION,
  ORGANIZATIONS_HEADING,
  SEARCH_APPS,
  WELCOME_TOUR,
  NO_APPS_FOUND,
} from "@appsmith/constants/messages";
import { ReactComponent as NoAppsFoundIcon } from "assets/svg/no-apps-icon.svg";

import { howMuchTimeBeforeText } from "utils/helpers";
import { setHeaderMeta } from "actions/themeActions";
import getFeatureFlags from "utils/featureFlags";
import { setIsImportAppViaGitModalOpen } from "actions/gitSyncActions";
import SharedUserList from "pages/common/SharedUserList";
import { getOnboardingOrganisations } from "selectors/onboardingSelectors";
import { useIsMobileDevice } from "utils/hooks/useDeviceDetect";
import { Indices } from "constants/Layers";
import { getAppsmithConfigs } from "@appsmith/configs";
import AnalyticsUtil from "utils/AnalyticsUtil";

const OrgDropDown = styled.div<{ isMobile?: boolean }>`
  display: flex;
  padding: ${(props) => (props.isMobile ? `10px 16px` : `10px 10px`)};
  font-size: ${(props) => props.theme.fontSizes[1]}px;
  justify-content: space-between;
  align-items: center;
  ${({ isMobile }) =>
    isMobile &&
    `
    position: sticky;
    top: 0;
    background-color: #fff;
    z-index: ${Indices.Layer8};
  `}
`;

const ApplicationCardsWrapper = styled.div<{ isMobile?: boolean }>`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ isMobile }) => (isMobile ? 12 : 20)}px;
  font-size: ${(props) => props.theme.fontSizes[4]}px;
  padding: ${({ isMobile }) => (isMobile ? `10px 16px` : `10px`)};
`;

const OrgSection = styled.div<{ isMobile?: boolean }>`
  margin-bottom: ${({ isMobile }) => (isMobile ? `8` : `40`)}px;
`;

const PaddingWrapper = styled.div<{ isMobile?: boolean }>`
  display: flex;
  align-items: baseline;
  justify-content: center;
  width: ${(props) => props.theme.card.minWidth}px;

  @media screen and (min-width: 1500px) {
    .bp3-card {
      width: ${(props) => props.theme.card.minWidth}px;
      height: ${(props) => props.theme.card.minHeight}px;
    }
  }

  @media screen and (min-width: 1500px) and (max-width: 1512px) {
    width: ${(props) =>
      props.theme.card.minWidth + props.theme.spaces[4] * 2}px;
    .bp3-card {
      width: ${(props) => props.theme.card.minWidth - 5}px;
      height: ${(props) => props.theme.card.minHeight - 5}px;
    }
  }
  @media screen and (min-width: 1478px) and (max-width: 1500px) {
    width: ${(props) =>
      props.theme.card.minWidth + props.theme.spaces[4] * 2}px;
    .bp3-card {
      width: ${(props) => props.theme.card.minWidth - 8}px;
      height: ${(props) => props.theme.card.minHeight - 8}px;
    }
  }

  @media screen and (min-width: 1447px) and (max-width: 1477px) {
    width: ${(props) =>
      props.theme.card.minWidth + props.theme.spaces[3] * 2}px;
    .bp3-card {
      width: ${(props) => props.theme.card.minWidth - 8}px;
      height: ${(props) => props.theme.card.minHeight - 8}px;
    }
  }

  @media screen and (min-width: 1417px) and (max-width: 1446px) {
    width: ${(props) =>
      props.theme.card.minWidth + props.theme.spaces[3] * 2}px;
    .bp3-card {
      width: ${(props) => props.theme.card.minWidth - 11}px;
      height: ${(props) => props.theme.card.minHeight - 11}px;
    }
  }

  @media screen and (min-width: 1400px) and (max-width: 1417px) {
    width: ${(props) =>
      props.theme.card.minWidth + props.theme.spaces[2] * 2}px;
    .bp3-card {
      width: ${(props) => props.theme.card.minWidth - 15}px;
      height: ${(props) => props.theme.card.minHeight - 15}px;
    }
  }

  @media screen and (max-width: 1400px) {
    width: ${(props) =>
      props.theme.card.minWidth + props.theme.spaces[2] * 2}px;
    .bp3-card {
      width: ${(props) => props.theme.card.minWidth - 15}px;
      height: ${(props) => props.theme.card.minHeight - 15}px;
    }
  }

  ${({ isMobile }) =>
    isMobile &&
    `
    width: 100% !important;
  `}
`;

const LeftPaneWrapper = styled.div`
  overflow: auto;
  width: ${(props) => props.theme.homePage.sidebar}px;
  height: 100%;
  display: flex;
  padding-left: 16px;
  padding-top: 16px;
  flex-direction: column;
  position: fixed;
  top: ${(props) => props.theme.homePage.header}px;
  box-shadow: 1px 0px 0px #ededed;
`;
const ApplicationContainer = styled.div<{ isMobile?: boolean }>`
  height: calc(100vh - ${(props) => props.theme.homePage.search.height - 40}px);
  overflow: auto;
  padding-right: ${(props) => props.theme.homePage.leftPane.rightMargin}px;
  padding-top: 16px;
  margin-left: ${(props) =>
    props.theme.homePage.leftPane.width +
    props.theme.homePage.leftPane.rightMargin +
    props.theme.homePage.leftPane.leftPadding}px;
  width: calc(
    100% -
      ${(props) =>
        props.theme.homePage.leftPane.width +
        props.theme.homePage.leftPane.rightMargin +
        props.theme.homePage.leftPane.leftPadding}px
  );
  scroll-behavior: smooth;
  ${({ isMobile }) =>
    isMobile &&
    `
    margin-left: 0;
    width: 100%;
    padding: 0;
  `}
`;

const ItemWrapper = styled.div`
  padding: 9px 15px;
`;
const StyledIcon = styled(Icon)`
  margin-right: 11px;
`;
const OrgShareUsers = styled.div`
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

  & button,
  & a {
    padding: 4px 12px;
  }
`;

const NoAppsFound = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;

  & > span {
    margin-bottom: 24px;
  }
`;

function Item(props: {
  label: string;
  textType: TextType;
  icon?: IconName;
  isFetchingApplications: boolean;
}) {
  return (
    <ItemWrapper>
      {props.icon && <StyledIcon />}
      <Text
        className={
          props.isFetchingApplications ? BlueprintClasses.SKELETON : ""
        }
        type={props.textType}
      >
        {" "}
        {props.label}
      </Text>
    </ItemWrapper>
  );
}

const LeftPaneDataSection = styled.div`
  position: relative;
  height: calc(100vh - ${(props) => props.theme.homePage.header + 24}px);
`;

function LeftPaneSection(props: {
  heading: string;
  children?: any;
  isFetchingApplications: boolean;
}) {
  return (
    <LeftPaneDataSection>
      {/* <MenuItem text={props.heading}/> */}
      <Item
        isFetchingApplications={props.isFetchingApplications}
        label={props.heading}
        textType={TextType.SIDE_HEAD}
      />
      {props.children}
    </LeftPaneDataSection>
  );
}

const StyledAnchor = styled.a`
  position: relative;
  top: -24px;
`;

const WorkpsacesNavigator = styled.div`
  overflow: auto;
  height: calc(100vh - ${(props) => props.theme.homePage.header + 252}px);
  ${thinScrollbar};
  /* padding-bottom: 160px; */
`;

const LeftPaneBottomSection = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding-bottom: 8px;
  background-color: #fff;

  & .ads-dialog-trigger {
    margin-top: 4px;
  }

  & .ads-dialog-trigger > div {
    position: initial;
    width: 92%;
    padding: 0 14px;
  }
`;

const LeftPaneVersionData = styled.div`
  display: flex;
  justify-content: space-between;
  color: #121826;
  font-size: 8px;
  width: 92%;
  margin-top: 8px;
`;

const textIconStyles = (props: { color: string; hover: string }) => {
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

function OrgMenuItem({ isFetchingApplications, org, selected }: any) {
  const menuRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (selected) {
      menuRef.current?.scrollIntoView({ behavior: "smooth" });
      menuRef.current?.click();
    }
  }, [selected]);

  return (
    <MenuItem
      containerClassName={
        isFetchingApplications ? BlueprintClasses.SKELETON : ""
      }
      ellipsize={20}
      href={`${window.location.pathname}#${org.organization.slug}`}
      icon="workspace"
      key={org.organization.slug}
      ref={menuRef}
      selected={selected}
      text={org.organization.name}
    />
  );
}

const submitCreateOrganizationForm = async (data: any, dispatch: any) => {
  const result = await createOrganizationSubmitHandler(data, dispatch);
  return result;
};

function LeftPane() {
  const dispatch = useDispatch();
  const fetchedUserOrgs = useSelector(getUserApplicationsOrgs);
  const onboardingOrgs = useSelector(getOnboardingOrganisations);
  const isFetchingApplications = useSelector(getIsFetchingApplications);
  const { appVersion } = getAppsmithConfigs();
  const howMuchTimeBefore = howMuchTimeBeforeText(appVersion.releaseDate);
  const isMobile = useIsMobileDevice();
  let userOrgs;
  if (!isFetchingApplications) {
    userOrgs = fetchedUserOrgs;
  } else {
    userOrgs = loadingUserOrgs as any;
  }

  const location = useLocation();
  const urlHash = location.hash.slice(1);

  if (isMobile) return null;

  return (
    <LeftPaneWrapper>
      <LeftPaneSection
        heading={createMessage(ORGANIZATIONS_HEADING)}
        isFetchingApplications={isFetchingApplications}
      >
        <WorkpsacesNavigator data-cy="t--left-panel">
          {!isFetchingApplications && fetchedUserOrgs && (
            <MenuItem
              cypressSelector="t--org-new-organization-auto-create"
              icon="plus"
              onSelect={() =>
                submitCreateOrganizationForm(
                  {
                    name: getNextEntityName(
                      "Untitled organization ",
                      fetchedUserOrgs.map((el: any) => el.organization.name),
                    ),
                  },
                  dispatch,
                )
              }
              text={CREATE_ORGANIZATION_FORM_NAME}
            />
          )}
          {userOrgs &&
            userOrgs.map((org: any) => (
              <OrgMenuItem
                isFetchingApplications={isFetchingApplications}
                key={org.organization.slug}
                org={org}
                selected={urlHash === org.organization.slug}
              />
            ))}
        </WorkpsacesNavigator>
        <LeftPaneBottomSection>
          <MenuItem
            className={isFetchingApplications ? BlueprintClasses.SKELETON : ""}
            icon="discord"
            onSelect={() => {
              window.open("https://discord.gg/rBTTVJp", "_blank");
            }}
            text={"Join our Discord"}
          />
          <MenuItem
            containerClassName={
              isFetchingApplications ? BlueprintClasses.SKELETON : ""
            }
            icon="book"
            onSelect={() => {
              window.open("https://docs.appsmith.com/", "_blank");
            }}
            text={createMessage(DOCUMENTATION)}
          />
          {!!onboardingOrgs.length && (
            <MenuItem
              containerClassName={
                isFetchingApplications
                  ? BlueprintClasses.SKELETON
                  : "t--welcome-tour"
              }
              icon="guide"
              onSelect={() => {
                AnalyticsUtil.logEvent("WELCOME_TOUR_CLICK");
                dispatch(onboardingCreateApplication());
              }}
              text={createMessage(WELCOME_TOUR)}
            />
          )}
          <ProductUpdatesModal />
          <LeftPaneVersionData>
            <span>Appsmith {appVersion.id}</span>
            {howMuchTimeBefore !== "" && (
              <span>Released {howMuchTimeBefore} ago</span>
            )}
          </LeftPaneVersionData>
        </LeftPaneBottomSection>
      </LeftPaneSection>
    </LeftPaneWrapper>
  );
}

const CreateNewLabel = styled(Text)`
  margin-top: 18px;
`;

const OrgNameElement = styled(Text)<{ isMobile?: boolean }>`
  max-width: ${({ isMobile }) => (isMobile ? 220 : 500)}px;
  ${truncateTextUsingEllipsis}
`;

const OrgNameHolder = styled(Text)`
  display: flex;
  align-items: center;
`;

const OrgNameWrapper = styled.div<{ disabled?: boolean }>`
  ${(props) => {
    const color = props.disabled
      ? props.theme.colors.applications.orgColor
      : props.theme.colors.applications.hover.orgColor[9];
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
const OrgRename = styled(EditableText)`
  padding: 0 2px;
`;

const NoSearchResultImg = styled.img`
  margin: 1em;
`;

function ApplicationsSection(props: any) {
  const enableImportExport = true;
  const dispatch = useDispatch();
  const theme = useContext(ThemeContext);
  const isSavingOrgInfo = useSelector(getIsSavingOrgInfo);
  const isFetchingApplications = useSelector(getIsFetchingApplications);
  const userOrgs = useSelector(getUserApplicationsOrgsList);
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
  const [warnLeavingOrganization, setWarnLeavingOrganization] = useState(false);
  const [warnDeleteOrg, setWarnDeleteOrg] = useState(false);
  const [orgToOpenMenu, setOrgToOpenMenu] = useState<string | null>(null);
  const updateApplicationDispatch = (
    id: string,
    data: UpdateApplicationPayload,
  ) => {
    dispatch(updateApplication(id, data));
  };

  const duplicateApplicationDispatch = (applicationId: string) => {
    dispatch(duplicateApplication(applicationId));
  };

  const [selectedOrgId, setSelectedOrgId] = useState<string | undefined>();
  const [
    selectedOrgIdForImportApplication,
    setSelectedOrgIdForImportApplication,
  ] = useState<string | undefined>();
  const Form: any = OrgInviteUsersForm;

  const leaveOrg = (orgId: string) => {
    setWarnLeavingOrganization(false);
    setOrgToOpenMenu(null);
    dispatch(leaveOrganization(orgId));
  };

  const handleDeleteOrg = useCallback(
    (orgId: string) => {
      setWarnDeleteOrg(false);
      setOrgToOpenMenu(null);
      dispatch(deleteOrg(orgId));
    },
    [dispatch],
  );

  const OrgNameChange = (newName: string, orgId: string) => {
    dispatch(
      saveOrg({
        id: orgId as string,
        name: newName,
      }),
    );
  };

  function OrgMenuTarget(props: {
    orgName: string;
    disabled?: boolean;
    orgSlug: string;
  }) {
    const { disabled, orgName, orgSlug } = props;

    return (
      <OrgNameWrapper className="t--org-name-text" disabled={disabled}>
        <StyledAnchor id={orgSlug} />
        <OrgNameHolder
          className={isFetchingApplications ? BlueprintClasses.SKELETON : ""}
          type={TextType.H1}
        >
          <OrgNameElement
            className={isFetchingApplications ? BlueprintClasses.SKELETON : ""}
            isMobile={isMobile}
            type={TextType.H1}
          >
            {orgName}
          </OrgNameElement>
        </OrgNameHolder>
      </OrgNameWrapper>
    );
  }

  const createNewApplication = (applicationName: string, orgId: string) => {
    const color = getRandomPaletteColor(theme.colors.appCardColors);
    const icon =
      AppIconCollection[Math.floor(Math.random() * AppIconCollection.length)];

    return dispatch({
      type: ReduxActionTypes.CREATE_APPLICATION_INIT,
      payload: {
        applicationName,
        orgId,
        icon,
        color,
      },
    });
  };

  let updatedOrgs;
  if (!isFetchingApplications) {
    updatedOrgs = userOrgs;
  } else {
    updatedOrgs = loadingUserOrgs as any;
  }

  let organizationsListComponent;
  if (
    !isFetchingApplications &&
    props.searchKeyword &&
    props.searchKeyword.trim().length > 0 &&
    updatedOrgs.length === 0
  ) {
    organizationsListComponent = (
      <CenteredWrapper
        style={{
          flexDirection: "column",
          marginTop: "-150px",
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
    organizationsListComponent = updatedOrgs.map(
      (organizationObject: any, index: number) => {
        const { applications, organization } = organizationObject;
        const hasManageOrgPermissions = isPermitted(
          organization.userPermissions,
          PERMISSION_TYPE.MANAGE_ORGANIZATION,
        );
        return (
          <OrgSection
            className="t--org-section"
            isMobile={isMobile}
            key={index}
          >
            <OrgDropDown isMobile={isMobile}>
              {(currentUser || isFetchingApplications) &&
                OrgMenuTarget({
                  orgName: organization.name,
                  orgSlug: organization.slug,
                })}
              {selectedOrgIdForImportApplication && (
                <ImportApplicationModal
                  isModalOpen={
                    selectedOrgIdForImportApplication === organization.id
                  }
                  onClose={() => setSelectedOrgIdForImportApplication("")}
                  organizationId={selectedOrgIdForImportApplication}
                />
              )}
              {hasManageOrgPermissions && (
                <Dialog
                  canEscapeKeyClose={false}
                  canOutsideClickClose
                  isOpen={selectedOrgId === organization.id}
                  onClose={() => setSelectedOrgId("")}
                  title={`Invite Users to ${organization.name}`}
                >
                  <Form orgId={organization.id} />
                </Dialog>
              )}
              {isPermitted(
                organization.userPermissions,
                PERMISSION_TYPE.INVITE_USER_TO_ORGANIZATION,
              ) &&
                !isFetchingApplications && (
                  <OrgShareUsers>
                    <SharedUserList orgId={organization.id} />
                    {!isMobile && (
                      <FormDialogComponent
                        Form={OrgInviteUsersForm}
                        canOutsideClickClose
                        orgId={organization.id}
                        title={`Invite Users to ${organization.name}`}
                        trigger={
                          <Button
                            category={Category.tertiary}
                            icon={"share-line"}
                            size={Size.medium}
                            tag="button"
                            text={"Share"}
                          />
                        }
                      />
                    )}
                    {isPermitted(
                      organization.userPermissions,
                      PERMISSION_TYPE.CREATE_APPLICATION,
                    ) &&
                      !isMobile &&
                      !isFetchingApplications &&
                      applications.length !== 0 && (
                        <Button
                          className="t--new-button createnew"
                          icon={"plus"}
                          isLoading={
                            creatingApplicationMap &&
                            creatingApplicationMap[organization.id]
                          }
                          onClick={() => {
                            if (
                              Object.entries(creatingApplicationMap).length ===
                                0 ||
                              (creatingApplicationMap &&
                                !creatingApplicationMap[organization.id])
                            ) {
                              createNewApplication(
                                getNextEntityName(
                                  "Untitled application ",
                                  applications.map((el: any) => el.name),
                                ),
                                organization.id,
                              );
                            }
                          }}
                          size={Size.medium}
                          tag="button"
                          text={"New"}
                        />
                      )}
                    {(currentUser || isFetchingApplications) && !isMobile && (
                      <Menu
                        className="t--org-name"
                        cypressSelector="t--org-name"
                        disabled={isFetchingApplications}
                        isOpen={organization.slug === orgToOpenMenu}
                        onClose={() => {
                          setOrgToOpenMenu(null);
                        }}
                        onClosing={() => {
                          setWarnLeavingOrganization(false);
                          setWarnDeleteOrg(false);
                        }}
                        position={Position.BOTTOM_RIGHT}
                        target={
                          <Icon
                            className="t--options-icon"
                            name="context-menu"
                            onClick={() => setOrgToOpenMenu(organization.slug)}
                            size={IconSize.XXXL}
                          />
                        }
                      >
                        {hasManageOrgPermissions && (
                          <>
                            <div className="px-3 py-2">
                              <OrgRename
                                cypressSelector="t--org-rename-input"
                                defaultValue={organization.name}
                                editInteractionKind={EditInteractionKind.SINGLE}
                                fill
                                hideEditIcon={false}
                                isEditingDefault={false}
                                isInvalid={(value: string) => {
                                  return notEmptyValidator(value).message;
                                }}
                                onBlur={(value: string) => {
                                  OrgNameChange(value, organization.id);
                                }}
                                placeholder="Workspace name"
                                savingState={
                                  isSavingOrgInfo
                                    ? SavingState.STARTED
                                    : SavingState.NOT_STARTED
                                }
                                underline
                              />
                            </div>
                            <MenuItem
                              cypressSelector="t--org-setting"
                              icon="general"
                              onSelect={() =>
                                getOnSelectAction(
                                  DropdownOnSelectActions.REDIRECT,
                                  {
                                    path: `/org/${organization.id}/settings/general`,
                                  },
                                )
                              }
                              text="Organization Settings"
                            />
                            {enableImportExport && (
                              <MenuItem
                                cypressSelector="t--org-import-app"
                                icon="upload"
                                onSelect={() =>
                                  setSelectedOrgIdForImportApplication(
                                    organization.id,
                                  )
                                }
                                text="Import Application"
                              />
                            )}
                            {getFeatureFlags().GIT_IMPORT && (
                              <MenuItem
                                cypressSelector="t--org-import-app-git"
                                icon="upload"
                                onSelect={() => {
                                  AnalyticsUtil.logEvent(
                                    "GS_IMPORT_VIA_GIT_CLICK",
                                  );
                                  dispatch(
                                    setIsImportAppViaGitModalOpen({
                                      isOpen: true,
                                      organizationId: organization.id,
                                    }),
                                  );
                                }}
                                text="Import Via GIT"
                              />
                            )}
                            <MenuItem
                              icon="share"
                              onSelect={() => setSelectedOrgId(organization.id)}
                              text="Share"
                            />
                            <MenuItem
                              icon="user"
                              onSelect={() =>
                                getOnSelectAction(
                                  DropdownOnSelectActions.REDIRECT,
                                  {
                                    path: `/org/${organization.id}/settings/members`,
                                  },
                                )
                              }
                              text="Members"
                            />
                          </>
                        )}
                        <MenuItem
                          icon="logout"
                          onSelect={() =>
                            !warnLeavingOrganization
                              ? setWarnLeavingOrganization(true)
                              : leaveOrg(organization.id)
                          }
                          text={
                            !warnLeavingOrganization
                              ? "Leave Organization"
                              : "Are you sure?"
                          }
                          type={
                            !warnLeavingOrganization ? undefined : "warning"
                          }
                        />
                        {applications.length === 0 && hasManageOrgPermissions && (
                          <MenuItem
                            icon="trash"
                            onSelect={() => {
                              warnDeleteOrg
                                ? handleDeleteOrg(organization.id)
                                : setWarnDeleteOrg(true);
                            }}
                            text={
                              !warnDeleteOrg
                                ? "Delete Organization"
                                : "Are you sure?"
                            }
                            type={!warnDeleteOrg ? undefined : "warning"}
                          />
                        )}
                      </Menu>
                    )}
                  </OrgShareUsers>
                )}
            </OrgDropDown>
            <ApplicationCardsWrapper isMobile={isMobile} key={organization.id}>
              {applications.map((application: any) => {
                return (
                  <PaddingWrapper isMobile={isMobile} key={application.id}>
                    <ApplicationCard
                      application={application}
                      delete={deleteApplication}
                      duplicate={duplicateApplicationDispatch}
                      enableImportExport={enableImportExport}
                      isMobile={isMobile}
                      key={application.id}
                      update={updateApplicationDispatch}
                    />
                  </PaddingWrapper>
                );
              })}
              {applications.length === 0 && (
                <NoAppsFound>
                  <NoAppsFoundIcon />
                  <span>There’s nothing inside this organization</span>
                  {/* below component is duplicate. This is because of cypress test were failing */}
                  {!isMobile && (
                    <Button
                      className="t--new-button createnew"
                      icon={"plus"}
                      isLoading={
                        creatingApplicationMap &&
                        creatingApplicationMap[organization.id]
                      }
                      onClick={() => {
                        if (
                          Object.entries(creatingApplicationMap).length === 0 ||
                          (creatingApplicationMap &&
                            !creatingApplicationMap[organization.id])
                        ) {
                          createNewApplication(
                            getNextEntityName(
                              "Untitled application ",
                              applications.map((el: any) => el.name),
                            ),
                            organization.id,
                          );
                        }
                      }}
                      size={Size.medium}
                      tag="button"
                      text={"New"}
                    />
                  )}
                </NoAppsFound>
              )}
            </ApplicationCardsWrapper>
          </OrgSection>
        );
      },
    );
  }

  return (
    <ApplicationContainer
      className="t--applications-container"
      isMobile={isMobile}
    >
      {organizationsListComponent}
      {getFeatureFlags().GIT_IMPORT && <ImportAppViaGitModal />}
    </ApplicationContainer>
  );
}
type ApplicationProps = {
  applicationList: ApplicationPayload[];
  searchApplications: (keyword: string) => void;
  isCreatingApplication: creatingApplicationMap;
  isFetchingApplications: boolean;
  createApplicationError?: string;
  deleteApplication: (id: string) => void;
  deletingApplication: boolean;
  duplicatingApplication: boolean;
  getAllApplication: () => void;
  userOrgs: any;
  currentUser?: User;
  searchKeyword: string | undefined;
  setHeaderMetaData: (
    hideHeaderShadow: boolean,
    showHeaderSeparator: boolean,
  ) => void;
};

class Applications extends Component<
  ApplicationProps,
  { selectedOrgId: string; showOnboardingForm: boolean }
> {
  constructor(props: ApplicationProps) {
    super(props);

    this.state = {
      selectedOrgId: "",
      showOnboardingForm: false,
    };
  }

  componentDidMount() {
    PerformanceTracker.stopTracking(PerformanceTransactionName.LOGIN_CLICK);
    PerformanceTracker.stopTracking(PerformanceTransactionName.SIGN_UP);
    this.props.getAllApplication();
    this.props.setHeaderMetaData(true, true);
  }

  componentWillUnmount() {
    this.props.setHeaderMetaData(false, false);
  }

  public render() {
    return (
      <PageWrapper displayName="Applications">
        <LeftPane />
        <SubHeader
          search={{
            placeholder: createMessage(SEARCH_APPS),
            queryFn: this.props.searchApplications,
            defaultValue: this.props.searchKeyword,
          }}
        />
        <ApplicationsSection searchKeyword={this.props.searchKeyword} />
      </PageWrapper>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  applicationList: getApplicationList(state),
  isFetchingApplications: getIsFetchingApplications(state),
  isCreatingApplication: getIsCreatingApplication(state),
  createApplicationError: getCreateApplicationError(state),
  deletingApplication: getIsDeletingApplication(state),
  duplicatingApplication: getIsDuplicatingApplication(state),
  userOrgs: getUserApplicationsOrgsList(state),
  currentUser: getCurrentUser(state),
  searchKeyword: getApplicationSearchKeyword(state),
});

const mapDispatchToProps = (dispatch: any) => ({
  getAllApplication: () => {
    dispatch({ type: ReduxActionTypes.GET_ALL_APPLICATION_INIT });
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
});

export default connect(mapStateToProps, mapDispatchToProps)(Applications);
