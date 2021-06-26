import React, {
  Component,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import styled, { ThemeContext } from "styled-components";
import { connect, useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { AppState } from "reducers";
import { Card, Classes as BlueprintClasses, Dialog } from "@blueprintjs/core";
import { truncateTextUsingEllipsis } from "constants/DefaultTheme";
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
import PageSectionDivider from "pages/common/PageSectionDivider";
import ApplicationCard from "./ApplicationCard";
import OrgInviteUsersForm from "pages/organization/OrgInviteUsersForm";
import { isPermitted, PERMISSION_TYPE } from "./permissionHelpers";
import FormDialogComponent from "components/editorComponents/form/FormDialogComponent";
// import OnboardingHelper from "components/editorComponents/Onboarding/Helper";
import { User } from "constants/userConstants";
import { getCurrentUser } from "selectors/usersSelectors";
import { CREATE_ORGANIZATION_FORM_NAME } from "constants/forms";
import {
  DropdownOnSelectActions,
  getOnSelectAction,
} from "pages/common/CustomizedDropdown/dropdownHelpers";
import Button, { Size } from "components/ads/Button";
import Text, { TextType } from "components/ads/Text";
import Icon, { IconName, IconSize } from "components/ads/Icon";
import MenuItem from "components/ads/MenuItem";
import {
  duplicateApplication,
  updateApplication,
} from "actions/applicationActions";
import { Classes } from "components/ads/common";
import Menu from "components/ads/Menu";
import { Position } from "@blueprintjs/core/lib/esm/common/position";
import HelpModal from "components/designSystems/appsmith/help/HelpModal";
import { UpdateApplicationPayload, UserRoles } from "api/ApplicationApi";
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
import { saveOrg } from "actions/orgActions";
import { leaveOrganization } from "actions/userActions";
import CenteredWrapper from "../../components/designSystems/appsmith/CenteredWrapper";
import NoSearchImage from "../../assets/images/NoSearchResult.svg";
import { getNextEntityName, getRandomPaletteColor } from "utils/AppsmithUtils";
import Spinner from "components/ads/Spinner";
import ProfileImage from "pages/common/ProfileImage";
import { AppIconCollection } from "components/ads/AppIcon";
import ProductUpdatesModal from "pages/Applications/ProductUpdatesModal";
import WelcomeHelper from "components/editorComponents/Onboarding/WelcomeHelper";
import { useIntiateOnboarding } from "components/editorComponents/Onboarding/utils";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { createOrganizationSubmitHandler } from "../organization/helpers";
import UserApi from "api/UserApi";
import ImportApplicationModal from "./ImportApplicationModal";
import OnboardingForm from "./OnboardingForm";
import { getAppsmithConfigs } from "configs";
import { SIGNUP_SUCCESS_URL } from "constants/routes";

const OrgDropDown = styled.div`
  display: flex;
  padding: ${(props) => props.theme.spaces[4]}px
    ${(props) => props.theme.spaces[4]}px;
  font-size: ${(props) => props.theme.fontSizes[1]}px;
  justify-content: space-between;
  align-items: center;
`;

const ApplicationCardsWrapper = styled.div`
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
  align-items: space-evenly;
  font-size: ${(props) => props.theme.fontSizes[4]}px;
`;

const OrgSection = styled.div``;

const PaddingWrapper = styled.div`
  width: ${(props) => props.theme.card.minWidth + props.theme.spaces[5] * 2}px;
  margin: ${(props) => props.theme.spaces[6] + 1}px 0px
    ${(props) => props.theme.spaces[6] + 1}px 0px;

  @media screen and (min-width: 1500px) {
    margin-right: ${(props) => props.theme.spaces[12] - 1}px;
    .bp3-card {
      width: ${(props) => props.theme.card.minWidth}px;
      height: ${(props) => props.theme.card.minHeight}px;
    }
  }

  @media screen and (min-width: 1500px) and (max-width: 1512px) {
    width: ${(props) =>
      props.theme.card.minWidth + props.theme.spaces[4] * 2}px;
    margin-right: ${(props) => props.theme.spaces[12] - 1}px;
    .bp3-card {
      width: ${(props) => props.theme.card.minWidth - 5}px;
      height: ${(props) => props.theme.card.minHeight - 5}px;
    }
  }
  @media screen and (min-width: 1478px) and (max-width: 1500px) {
    width: ${(props) =>
      props.theme.card.minWidth + props.theme.spaces[4] * 2}px;
    margin-right: ${(props) => props.theme.spaces[11] + 1}px;
    .bp3-card {
      width: ${(props) => props.theme.card.minWidth - 8}px;
      height: ${(props) => props.theme.card.minHeight - 8}px;
    }
  }

  @media screen and (min-width: 1447px) and (max-width: 1477px) {
    width: ${(props) =>
      props.theme.card.minWidth + props.theme.spaces[3] * 2}px;
    margin-right: ${(props) => props.theme.spaces[11] - 4}px;
    .bp3-card {
      width: ${(props) => props.theme.card.minWidth - 8}px;
      height: ${(props) => props.theme.card.minHeight - 8}px;
    }
  }

  @media screen and (min-width: 1417px) and (max-width: 1446px) {
    width: ${(props) =>
      props.theme.card.minWidth + props.theme.spaces[3] * 2}px;
    margin-right: ${(props) => props.theme.spaces[11] - 8}px;
    .bp3-card {
      width: ${(props) => props.theme.card.minWidth - 11}px;
      height: ${(props) => props.theme.card.minHeight - 11}px;
    }
  }

  @media screen and (min-width: 1400px) and (max-width: 1417px) {
    width: ${(props) =>
      props.theme.card.minWidth + props.theme.spaces[2] * 2}px;
    margin-right: ${(props) => props.theme.spaces[11] - 12}px;
    .bp3-card {
      width: ${(props) => props.theme.card.minWidth - 15}px;
      height: ${(props) => props.theme.card.minHeight - 15}px;
    }
  }

  @media screen and (max-width: 1400px) {
    width: ${(props) =>
      props.theme.card.minWidth + props.theme.spaces[2] * 2}px;
    margin-right: ${(props) => props.theme.spaces[11] - 16}px;
    .bp3-card {
      width: ${(props) => props.theme.card.minWidth - 15}px;
      height: ${(props) => props.theme.card.minHeight - 15}px;
    }
  }
`;

const StyledDialog = styled(Dialog)<{ setMaxWidth?: boolean }>`
  && {
    background: ${(props) => props.theme.colors.modal.bg};
    & .${BlueprintClasses.DIALOG_HEADER} {
      background: ${(props) => props.theme.colors.modal.bg};
      padding: ${(props) => props.theme.spaces[4]}px
        ${(props) => props.theme.spaces[4]}px;
    }
    & .${BlueprintClasses.DIALOG_FOOTER_ACTIONS} {
      display: block;
    }
    ${(props) => props.setMaxWidth && `width: 100vh;`}

    .${BlueprintClasses.HEADING} {
      color: ${(props) => props.theme.colors.modal.headerText};
    }
  }
`;

const LeftPaneWrapper = styled.div`
  // height: 50vh;
  overflow: auto;
  width: 256px;
  display: flex;
  padding-left: 16px;
  flex-direction: column;
  position: fixed;
  top: 77px;
`;
const ApplicationContainer = styled.div`
  height: calc(100vh - ${(props) => props.theme.homePage.search.height - 40}px);
  overflow: auto;
  padding-right: ${(props) => props.theme.homePage.leftPane.rightMargin}px;
  margin-top: ${(props) => props.theme.homePage.search.height}px;
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
`;

const ItemWrapper = styled.div`
  padding: 9px 15px;
`;
const StyledIcon = styled(Icon)`
  margin-right: 11px;
`;
const UserImageContainer = styled.div`
  display: flex;
  margin-right: 8px;

  div {
    cursor: default;
    margin-right: -6px;
    width: 24px;
    height: 24px;
  }

  div:last-child {
    margin-right: 0px;
  }
`;
const OrgShareUsers = styled.div`
  display: flex;
  align-items: center;
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
function LeftPaneSection(props: {
  heading: string;
  children?: any;
  isFetchingApplications: boolean;
}) {
  return (
    <>
      {/* <MenuItem text={props.heading}/> */}
      <Item
        isFetchingApplications={props.isFetchingApplications}
        label={props.heading}
        textType={TextType.H6}
      />
      {props.children}
    </>
  );
}

const StyledAnchor = styled.a`
  position: relative;
  top: -24px;
  // width: 0;
  // height: 0;
`;

const WorkpsacesNavigator = styled.div`
  overflow: auto;
  height: calc(100vh - ${(props) => props.theme.homePage.header + 36 + 25}px);
  padding-bottom: 88px;
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

const ApplicationAddCardWrapper = styled(Card)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: ${(props) => props.theme.colors.applications.bg};
  align-items: center;
  width: ${(props) => props.theme.card.minWidth}px;
  height: ${(props) => props.theme.card.minHeight}px;
  position: relative;
  box-shadow: none;
  border-radius: 0;
  padding: 0;
  margin: ${(props) => props.theme.spaces[5]}px;
  a {
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    height: calc(100% - ${(props) => props.theme.card.titleHeight}px);
    width: 100%;
  }
  cursor: pointer;
  &:hover {
    background: ${(props) => props.theme.colors.applications.hover.bg};
  }
  ${(props) => {
    return `${textIconStyles({
      color: props.theme.colors.applications.textColor,
      hover: props.theme.colors.applications.hover.textColor,
    })}`;
  }}
`;

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
      className={isFetchingApplications ? BlueprintClasses.SKELETON : ""}
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
  const isFetchingApplications = useSelector(getIsFetchingApplications);
  let userOrgs;
  if (!isFetchingApplications) {
    userOrgs = fetchedUserOrgs;
  } else {
    userOrgs = loadingUserOrgs as any;
  }

  const location = useLocation();
  const urlHash = location.hash.slice(1);

  const initiateOnboarding = useIntiateOnboarding();

  return (
    <LeftPaneWrapper>
      <LeftPaneSection
        heading="ORGANIZATIONS"
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
          <div style={{ marginTop: 12 }}>
            <Item
              isFetchingApplications={isFetchingApplications}
              label={"GETTING STARTED"}
              textType={TextType.H6}
            />
          </div>
          <MenuItem
            className={isFetchingApplications ? BlueprintClasses.SKELETON : ""}
            icon="book"
            onSelect={() => {
              window.open("https://docs.appsmith.com/", "_blank");
            }}
            text={"Documentation"}
          />
          <MenuItem
            className={
              isFetchingApplications
                ? BlueprintClasses.SKELETON
                : "t--welcome-tour"
            }
            icon="shine"
            onSelect={() => {
              AnalyticsUtil.logEvent("WELCOME_TOUR_CLICK");

              initiateOnboarding();
            }}
            text={"Welcome Tour"}
          />
        </WorkpsacesNavigator>
      </LeftPaneSection>
    </LeftPaneWrapper>
  );
}

const CreateNewLabel = styled(Text)`
  margin-top: 18px;
`;

const OrgNameElement = styled(Text)`
  max-width: 500px;
  ${truncateTextUsingEllipsis}
`;

const OrgNameHolder = styled(Text)`
  display: flex;
  align-items: center;
`;

const OrgNameWrapper = styled.div<{ disabled?: boolean }>`
cursor: ${(props) => (!props.disabled ? "pointer" : "inherit")};
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
  display: ${(props) => (!props.disabled ? "inline" : "none")};;
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
      <OrgNameWrapper
        className="t--org-name"
        disabled={disabled}
        onClick={() => setOrgToOpenMenu(orgSlug)}
      >
        <StyledAnchor id={orgSlug} />
        <OrgNameHolder
          className={isFetchingApplications ? BlueprintClasses.SKELETON : ""}
          type={TextType.H1}
        >
          <OrgNameElement
            className={isFetchingApplications ? BlueprintClasses.SKELETON : ""}
            type={TextType.H1}
          >
            {orgName}
          </OrgNameElement>
          <Icon name="downArrow" size={IconSize.XXS} />
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
      <CenteredWrapper style={{ flexDirection: "column", marginTop: "-150px" }}>
        <CreateNewLabel type={TextType.H4}>
          Whale! Whale! this name doesn&apos;t ring a bell!
        </CreateNewLabel>
        <NoSearchResultImg alt="No result found" src={NoSearchImage} />
      </CenteredWrapper>
    );
  } else {
    organizationsListComponent = updatedOrgs.map(
      (organizationObject: any, index: number) => {
        const { applications, organization, userRoles } = organizationObject;
        const hasManageOrgPermissions = isPermitted(
          organization.userPermissions,
          PERMISSION_TYPE.MANAGE_ORGANIZATION,
        );
        return (
          <OrgSection className="t--org-section" key={index}>
            <OrgDropDown>
              {(currentUser || isFetchingApplications) && (
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
                  }}
                  position={Position.BOTTOM_RIGHT}
                  target={OrgMenuTarget({
                    orgName: organization.name,
                    orgSlug: organization.slug,
                  })}
                >
                  {hasManageOrgPermissions && (
                    <>
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
                      <MenuItem
                        cypressSelector="t--org-setting"
                        icon="general"
                        onSelect={() =>
                          getOnSelectAction(DropdownOnSelectActions.REDIRECT, {
                            path: `/org/${organization.id}/settings/general`,
                          })
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
                      <MenuItem
                        icon="share"
                        onSelect={() => setSelectedOrgId(organization.id)}
                        text="Share"
                      />
                      <MenuItem
                        icon="user"
                        onSelect={() =>
                          getOnSelectAction(DropdownOnSelectActions.REDIRECT, {
                            path: `/org/${organization.id}/settings/members`,
                          })
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
                    type={!warnLeavingOrganization ? undefined : "warning"}
                  />
                </Menu>
              )}
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
                <StyledDialog
                  canEscapeKeyClose={false}
                  canOutsideClickClose={false}
                  isOpen={selectedOrgId === organization.id}
                  onClose={() => setSelectedOrgId("")}
                  setMaxWidth
                  title={`Invite Users to ${organization.name}`}
                >
                  <div className={BlueprintClasses.DIALOG_BODY}>
                    <Form orgId={organization.id} />
                  </div>
                </StyledDialog>
              )}
              {isPermitted(
                organization.userPermissions,
                PERMISSION_TYPE.INVITE_USER_TO_ORGANIZATION,
              ) &&
                !isFetchingApplications && (
                  <OrgShareUsers>
                    <UserImageContainer>
                      {userRoles.slice(0, 5).map((el: UserRoles) => (
                        <ProfileImage
                          className="org-share-user-icons"
                          key={el.username}
                          source={`/api/${UserApi.photoURL}/${el.username}`}
                          userName={el.name ? el.name : el.username}
                        />
                      ))}
                      {userRoles.length > 5 ? (
                        <ProfileImage
                          className="org-share-user-icons"
                          commonName={`+${userRoles.length - 5}`}
                        />
                      ) : null}
                    </UserImageContainer>
                    <FormDialogComponent
                      Form={OrgInviteUsersForm}
                      canOutsideClickClose
                      orgId={organization.id}
                      title={`Invite Users to ${organization.name}`}
                      trigger={
                        <Button
                          icon={"share"}
                          size={Size.small}
                          text={"Share"}
                        />
                      }
                    />
                  </OrgShareUsers>
                )}
            </OrgDropDown>
            <ApplicationCardsWrapper key={organization.id}>
              {isPermitted(
                organization.userPermissions,
                PERMISSION_TYPE.CREATE_APPLICATION,
              ) &&
                !isFetchingApplications && (
                  <PaddingWrapper>
                    <ApplicationAddCardWrapper
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
                    >
                      {creatingApplicationMap &&
                      creatingApplicationMap[organization.id] ? (
                        <Spinner size={IconSize.XXXL} />
                      ) : (
                        <>
                          <Icon
                            className="t--create-app-popup"
                            name={"plus"}
                            size={IconSize.LARGE}
                          />
                          <CreateNewLabel
                            className="createnew"
                            type={TextType.H4}
                          >
                            Create New
                          </CreateNewLabel>
                        </>
                      )}
                    </ApplicationAddCardWrapper>
                  </PaddingWrapper>
                )}
              {applications.map((application: any) => {
                return (
                  <PaddingWrapper key={application.id}>
                    <ApplicationCard
                      application={application}
                      delete={deleteApplication}
                      duplicate={duplicateApplicationDispatch}
                      enableImportExport={enableImportExport}
                      key={application.id}
                      update={updateApplicationDispatch}
                    />
                  </PaddingWrapper>
                );
              })}
              <PageSectionDivider />
            </ApplicationCardsWrapper>
          </OrgSection>
        );
      },
    );
  }

  return (
    <ApplicationContainer className="t--applications-container">
      {organizationsListComponent}
      <HelpModal page={"Applications"} />
      <WelcomeHelper />
    </ApplicationContainer>
  );
}
type ApplicationProps = {
  applicationList: ApplicationPayload[];
  createApplication: (appName: string) => void;
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
};

const getIsFromSignup = () => {
  return window.location?.pathname === SIGNUP_SUCCESS_URL;
};

const { onboardingFormEnabled } = getAppsmithConfigs();
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
    const isFromSignUp = getIsFromSignup();
    this.setState({
      showOnboardingForm: isFromSignUp && onboardingFormEnabled,
    });

    // Redirect directly in case we're not showing the onboarding form
    if (isFromSignUp && !onboardingFormEnabled) {
      const urlObject = new URL(window.location.href);
      const redirectUrl = urlObject?.searchParams.get("redirectUrl");
      if (redirectUrl) {
        try {
          window.location.replace(redirectUrl);
        } catch (e) {
          console.error("Error handling the redirect url");
        }
      }
    }
  }

  public render() {
    return (
      <PageWrapper displayName="Applications">
        {this.state.showOnboardingForm ? (
          <OnboardingForm />
        ) : (
          <>
            <ProductUpdatesModal />
            <LeftPane />
            <SubHeader
              search={{
                placeholder: "Search for apps...",
                queryFn: this.props.searchApplications,
              }}
            />
            <ApplicationsSection searchKeyword={this.props.searchKeyword} />
          </>
        )}
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
  getAllApplication: () =>
    dispatch({ type: ReduxActionTypes.GET_ALL_APPLICATION_INIT }),
  createApplication: (appName: string) => {
    dispatch({
      type: ReduxActionTypes.CREATE_APPLICATION_INIT,
      payload: {
        name: appName,
      },
    });
  },
  searchApplications: (keyword: string) => {
    dispatch({
      type: ReduxActionTypes.SEARCH_APPLICATIONS,
      payload: {
        keyword,
      },
    });
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(Applications);
