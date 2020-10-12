import React, { Component, useState } from "react";
import styled from "styled-components";
import { connect, useSelector, useDispatch } from "react-redux";
import { AppState } from "reducers";
import { Card, Dialog, Classes as BlueprintClasses } from "@blueprintjs/core";
import {
  getApplicationList,
  getIsFetchingApplications,
  getIsCreatingApplication,
  getCreateApplicationError,
  getIsDeletingApplication,
  getUserApplicationsOrgsList,
  getUserApplicationsOrgs,
  getIsDuplicatingApplication,
} from "selectors/applicationSelectors";
import {
  ReduxActionTypes,
  ApplicationPayload,
} from "constants/ReduxActionConstants";
import PageWrapper from "pages/common/PageWrapper";
import SubHeader from "pages/common/SubHeader";
import PageSectionDivider from "pages/common/PageSectionDivider";
import ApplicationCard from "./ApplicationCard";
import CreateApplicationForm from "./CreateApplicationForm";
import OrgInviteUsersForm from "pages/organization/OrgInviteUsersForm";
import { PERMISSION_TYPE, isPermitted } from "./permissionHelpers";
import FormDialogComponent from "components/editorComponents/form/FormDialogComponent";
import { User } from "constants/userConstants";
import { getCurrentUser } from "selectors/usersSelectors";
import CreateOrganizationForm from "pages/organization/CreateOrganizationForm";
import { CREATE_ORGANIZATION_FORM_NAME } from "constants/forms";
import {
  getOnSelectAction,
  DropdownOnSelectActions,
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
import { UpdateApplicationPayload } from "api/ApplicationApi";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";

const OrgDropDown = styled.div`
  display: flex;
  padding: ${props => props.theme.spaces[4]}px
    ${props => props.theme.spaces[4]}px;
  font-size: ${props => props.theme.fontSizes[1]}px;
  justify-content: space-between;
  align-items: center;
`;

const ApplicationCardsWrapper = styled.div`
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
  align-items: space-evenly;
  font-size: ${props => props.theme.fontSizes[4]}px;
`;

const OrgSection = styled.div``;

const PaddingWrapper = styled.div`
  width: ${props => props.theme.card.minWidth + props.theme.spaces[5] * 2}px;
  margin: ${props => props.theme.spaces[5]}px
    ${props => props.theme.spaces[5]}px;
`;

const StyledDialog = styled(Dialog)<{ setMaxWidth?: boolean }>`
  && {
    background: white;
    & .bp3-dialog-header {
      padding: ${props => props.theme.spaces[4]}px
        ${props => props.theme.spaces[4]}px;
    }
    & .bp3-dialog-footer-actions {
      display: block;
    }
    ${props => props.setMaxWidth && `width: 100vh;`}
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
  height: calc(100vh - ${props => props.theme.homePage.search.height - 40}px);
  overflow: auto;
  padding-right: ${props => props.theme.homePage.leftPane.rightMargin}px;
  margin-top: ${props => props.theme.homePage.search.height}px;
  margin-left: ${props =>
    props.theme.homePage.leftPane.width +
    props.theme.homePage.leftPane.rightMargin +
    props.theme.homePage.leftPane.leftPadding}px;
  width: calc(
    100% -
      ${props =>
        props.theme.homePage.leftPane.width +
        props.theme.homePage.leftPane.rightMargin +
        props.theme.homePage.leftPane.leftPadding}px
  );
`;

const ItemWrapper = styled.div`
  padding: 9px 15px;
`;
const StyledIcon = styled(Icon)`
  margin-right: 11px;
`;

function Item(props: { label: string; textType: TextType; icon?: IconName }) {
  return (
    <ItemWrapper>
      {props.icon && <StyledIcon />}
      <Text type={props.textType}> {props.label}</Text>
    </ItemWrapper>
  );
}
function LeftPaneSection(props: { heading: string; children?: any }) {
  return (
    <>
      {/* <MenuItem text={props.heading}/> */}
      <Item label={props.heading} textType={TextType.H6}></Item>
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
  height: calc(100vh - ${props => props.theme.homePage.header + 36 + 25}px);
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

const NewWorkspaceWrapper = styled.div`
  ${props => {
    return `${textIconStyles({
      color: props.theme.colors.applications.textColor,
      hover: props.theme.colors.applications.hover.textColor,
    })}`;
  }}
`;

const ApplicationAddCardWrapper = styled(Card)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: ${props => props.theme.colors.applications.bg};
  align-items: center;
  width: ${props => props.theme.card.minWidth}px;
  height: ${props => props.theme.card.minHeight}px;
  position: relative;
  box-shadow: none;
  border-radius: 0;
  padding: 0;
  margin: ${props => props.theme.spaces[11] - 2}px
    ${props => props.theme.spaces[5]}px;
  a {
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    height: calc(100% - ${props => props.theme.card.titleHeight}px);
    width: 100%;
  }
  cursor: pointer;
  &:hover {
    background: ${props => props.theme.colors.applications.hover.bg};
  }
  ${props => {
    return `${textIconStyles({
      color: props.theme.colors.applications.textColor,
      hover: props.theme.colors.applications.hover.textColor,
    })}`;
  }}
`;

function LeftPane() {
  const userOrgs = useSelector(getUserApplicationsOrgs);
  const NewWorkspaceTrigger = (
    <NewWorkspaceWrapper>
      <MenuItem
        key={"new-workspace"}
        text={"Create Organization"}
        icon="plus"
      />
    </NewWorkspaceWrapper>
  );
  return (
    <LeftPaneWrapper>
      <LeftPaneSection heading="ORGANIZATIONS">
        <WorkpsacesNavigator>
          <FormDialogComponent
            trigger={NewWorkspaceTrigger}
            Form={CreateOrganizationForm}
            title={CREATE_ORGANIZATION_FORM_NAME}
          />
          {/* {CreateOrg} */}
          {userOrgs &&
            userOrgs.map((org: any) => (
              <MenuItem
                icon="workspace"
                key={org.organization.name}
                href={`${window.location.pathname}#${org.organization.name}`}
                text={org.organization.name}
                ellipsize={20}
              />
            ))}
        </WorkpsacesNavigator>
      </LeftPaneSection>
      {/* <LeftPaneSection heading="GETTING STARTED"></LeftPaneSection> */}
    </LeftPaneWrapper>
  );
}

const CreateNewLabel = styled(Text)`
  margin-top: 18px;
`;

const OrgNameElement = styled(Text)`
  max-width: 500px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  display: block;
`;

const OrgNameHolder = styled(Text)`
  display: flex;
  align-items: center;
`;

const OrgNameInMenu = styled(Text)`
  max-width: 100%;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  display: block;
  padding: 9px ${props => props.theme.spaces[6]}px;
`;

const OrgNameWrapper = styled.div<{ disabled?: boolean }>`
cursor: ${props => (!props.disabled ? "pointer" : "inherit")};
${props => {
  const color = props.disabled
    ? props.theme.colors.applications.orgColor
    : props.theme.colors.applications.hover.orgColor[9];
  return `${textIconStyles({
    color: color,
    hover: color,
  })}`;
}}

.${Classes.ICON} {
  display: ${props => (!props.disabled ? "inline" : "none")};;
  margin-left: 8px;
  color: ${props => props.theme.colors.applications.iconColor};
}
`;

const ApplicationsSection = () => {
  const dispatch = useDispatch();
  const userOrgs = useSelector(getUserApplicationsOrgsList);
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
  const updateApplicationDispatch = (
    id: string,
    data: UpdateApplicationPayload,
  ) => {
    dispatch(updateApplication(id, data));
  };

  const duplicateApplicationDispatch = (applicationId: string) => {
    dispatch(duplicateApplication(applicationId));
  };

  const [selectedOrgId, setSelectedOrgId] = useState();
  const Form: any = OrgInviteUsersForm;
  const OrgMenu = (props: {
    orgName: string;
    orgId: string;
    disabled?: boolean;
    setSelectedOrgId: Function;
  }) => {
    const { orgName, orgId, disabled } = props;

    const OrgName = (
      <OrgNameWrapper disabled={disabled} className="t--org-name">
        <StyledAnchor id={orgName}></StyledAnchor>
        <OrgNameHolder type={TextType.H1}>
          <OrgNameElement type={TextType.H1}>{orgName}</OrgNameElement>
          <Icon name="downArrow" size={IconSize.XXS}></Icon>
        </OrgNameHolder>
      </OrgNameWrapper>
    );
    return disabled ? (
      OrgName
    ) : (
      <Menu
        target={OrgName}
        position={Position.BOTTOM_RIGHT}
        className="t--org-name"
      >
        <OrgNameInMenu type={TextType.H5}>{orgName}</OrgNameInMenu>
        <MenuItem
          icon="general"
          text="Organization Settings"
          onSelect={() =>
            getOnSelectAction(DropdownOnSelectActions.REDIRECT, {
              path: `/org/${orgId}/settings/general`,
            })
          }
        />
        <MenuItem
          text="Share"
          icon="share"
          onSelect={() => setSelectedOrgId(orgId)}
        ></MenuItem>
        <MenuItem
          icon="user"
          text="Members"
          onSelect={() =>
            getOnSelectAction(DropdownOnSelectActions.REDIRECT, {
              path: `/org/${orgId}/settings/members`,
            })
          }
        />
      </Menu>
    );
  };

  return (
    <ApplicationContainer className="t--applications-container">
      {userOrgs &&
        userOrgs.map((organizationObject: any, index: number) => {
          const { organization, applications } = organizationObject;
          const hasManageOrgPermissions = isPermitted(
            organization.userPermissions,
            PERMISSION_TYPE.MANAGE_ORGANIZATION,
          );
          return (
            <OrgSection className="t--org-section" key={index}>
              <OrgDropDown>
                {currentUser && (
                  <OrgMenu
                    setSelectedOrgId={setSelectedOrgId}
                    orgId={organization.id}
                    orgName={organization.name}
                    disabled={!hasManageOrgPermissions}
                  ></OrgMenu>
                )}

                {hasManageOrgPermissions && (
                  <StyledDialog
                    canOutsideClickClose={false}
                    canEscapeKeyClose={false}
                    title={`Invite Users to ${organization.name}`}
                    onClose={() => setSelectedOrgId("")}
                    isOpen={selectedOrgId === organization.id}
                    setMaxWidth
                  >
                    <div className={BlueprintClasses.DIALOG_BODY}>
                      <Form orgId={organization.id} />
                    </div>
                  </StyledDialog>
                )}
                {isPermitted(
                  organization.userPermissions,
                  PERMISSION_TYPE.INVITE_USER_TO_ORGANIZATION,
                ) && (
                  <FormDialogComponent
                    trigger={
                      <Button text={"Share"} icon={"share"} size={Size.small} />
                    }
                    canOutsideClickClose={true}
                    Form={OrgInviteUsersForm}
                    orgId={organization.id}
                    title={`Invite Users to ${organization.name}`}
                  />
                )}
              </OrgDropDown>
              <ApplicationCardsWrapper key={organization.id}>
                {isPermitted(
                  organization.userPermissions,
                  PERMISSION_TYPE.CREATE_APPLICATION,
                ) && (
                  <PaddingWrapper>
                    <FormDialogComponent
                      permissions={organization.userPermissions}
                      permissionRequired={PERMISSION_TYPE.CREATE_APPLICATION}
                      trigger={
                        <ApplicationAddCardWrapper>
                          <Icon
                            className="t--create-app-popup"
                            name={"plus"}
                            size={IconSize.LARGE}
                          ></Icon>
                          <CreateNewLabel
                            type={TextType.H4}
                            className="createnew"
                            // cypressSelector={"t--create-new-app"}
                          >
                            Create New
                          </CreateNewLabel>
                        </ApplicationAddCardWrapper>
                      }
                      Form={CreateApplicationForm}
                      orgId={organization.id}
                      title={"Create Application"}
                    />
                  </PaddingWrapper>
                )}
                {applications.map((application: any) => {
                  return (
                    application.pages?.length > 0 && (
                      <PaddingWrapper key={application.id}>
                        <ApplicationCard
                          key={application.id}
                          application={application}
                          delete={deleteApplication}
                          update={updateApplicationDispatch}
                          duplicate={duplicateApplicationDispatch}
                        />
                      </PaddingWrapper>
                    )
                  );
                })}
                <PageSectionDivider />
              </ApplicationCardsWrapper>
            </OrgSection>
          );
        })}
      <HelpModal page={"Applications"} />
    </ApplicationContainer>
  );
};
type ApplicationProps = {
  applicationList: ApplicationPayload[];
  createApplication: (appName: string) => void;
  searchApplications: (keyword: string) => void;
  isCreatingApplication: boolean;
  isFetchingApplications: boolean;
  createApplicationError?: string;
  deleteApplication: (id: string) => void;
  deletingApplication: boolean;
  duplicatingApplication: boolean;
  getAllApplication: () => void;
  userOrgs: any;
  currentUser?: User;
};
class Applications extends Component<
  ApplicationProps,
  { selectedOrgId: string }
> {
  constructor(props: ApplicationProps) {
    super(props);

    this.state = {
      selectedOrgId: "",
    };
  }

  componentDidMount() {
    PerformanceTracker.stopTracking(PerformanceTransactionName.LOGIN_CLICK);
    PerformanceTracker.stopTracking(PerformanceTransactionName.SIGN_UP);
    this.props.getAllApplication();
  }
  public render() {
    return (
      <PageWrapper displayName="Applications">
        <LeftPane />
        <SubHeader
          search={{
            placeholder: "Search for apps...",
            queryFn: this.props.searchApplications,
          }}
        />
        <ApplicationsSection></ApplicationsSection>
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
