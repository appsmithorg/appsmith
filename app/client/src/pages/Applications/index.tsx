import React, { Component } from "react";
import styled from "styled-components";
import { connect } from "react-redux";
import { AppState } from "reducers";
import { Card, Icon } from "@blueprintjs/core";
import Button from "components/editorComponents/Button";
import {
  getApplicationList,
  getIsFetchingApplications,
  getIsCreatingApplication,
  getCreateApplicationError,
  getIsDeletingApplication,
  getUserApplicationsOrgs,
  getUserApplicationsOrgsList,
} from "selectors/applicationSelectors";
import {
  ReduxActionTypes,
  ApplicationPayload,
} from "constants/ReduxActionConstants";
import PageWrapper from "pages/common/PageWrapper";
import SubHeader from "pages/common/SubHeader";
import PageSectionDivider from "pages/common/PageSectionDivider";
import { getApplicationPayloads } from "mockComponentProps/ApplicationPayloads";
import ApplicationCard from "./ApplicationCard";
import CreateApplicationForm from "./CreateApplicationForm";
import InviteUsersFormv2 from "pages/organization/InviteUsersFromv2";
import { CREATE_APPLICATION_FORM_NAME } from "constants/forms";
import { PERMISSION_TYPE } from "./permissionHelpers";
import { DELETING_APPLICATION } from "constants/messages";
import { AppToaster } from "components/editorComponents/ToastComponent";
import AnalyticsUtil from "utils/AnalyticsUtil";
import FormDialogComponent from "components/editorComponents/form/FormDialogComponent";
import OrganizationListMockResponse from "mockResponses/OrganisationListResponse";
import { User } from "constants/userConstants";
import CustomizedDropdown from "pages/common/CustomizedDropdown";
import DropdownProps from "pages/common/CustomizedDropdown/OrgDropdownData";
import { getCurrentUser } from "selectors/usersSelectors";
import CreateOrganizationForm from "pages/organization/CreateOrganizationForm";
import { CREATE_ORGANIZATION_FORM_NAME } from "constants/forms";

const OrgDropDown = styled.div`
  display: flex;
  padding: 0px 30px;
  font-size: ${props => props.theme.fontSizes[1]}px;
  justify-content: space-between;
`;

const ApplicationCardsWrapper = styled.div`
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
  align-items: space-evenly;
  font-size: ${props => props.theme.fontSizes[4]}px;
`;

const OrgName = styled.div`
  font-size: ${props => props.theme.fontSizes[6]}px;
  padding-top: ${props => props.theme.spaces[2]}px;
  padding-left: ${props => props.theme.spaces[5]}px;
`;

const ApplicationAddCardWrapper = styled(Card)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: ${props => props.theme.card.minWidth}px;
  height: ${props => props.theme.card.minHeight}px;
  position: relative;
  border-radius: ${props => props.theme.radii[1]}px;
  margin: ${props => props.theme.spaces[5]}px
    ${props => props.theme.spaces[5]}px;
  a {
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    height: calc(100% - ${props => props.theme.card.titleHeight}px);
    width: 100%;
  }
  :hover {
    cursor: pointer;
  }
`;

type ApplicationProps = {
  applicationList: ApplicationPayload[];
  fetchApplications: () => void;
  createApplication: (appName: string) => void;
  isCreatingApplication: boolean;
  isFetchingApplications: boolean;
  createApplicationError?: string;
  searchApplications: (keyword: string) => void;
  deleteApplication: (id: string) => void;
  deletingApplication: boolean;
  getAllApplication: () => void;
  userApplicationsOrgs: any;
  currentUser?: User;
};
class Applications extends Component<ApplicationProps> {
  componentDidMount() {
    this.props.getAllApplication();
  }
  public render() {
    const applicationList = this.props.isFetchingApplications
      ? getApplicationPayloads(8)
      : this.props.applicationList;
    return (
      <PageWrapper displayName="Applications">
        {this.props.deletingApplication
          ? AppToaster.show({ message: DELETING_APPLICATION })
          : AppToaster.clear()}
        <SubHeader
          add={{
            form: CreateOrganizationForm,
            title: "Create Organization",
            formName: CREATE_ORGANIZATION_FORM_NAME,
            formSubmitIntent: "primary",
            isAdding: false,
            formSubmitText: "Create",
            onClick: () => {
              return null;
            },
          }}
          search={{
            placeholder: "Search",
            queryFn: this.props.searchApplications,
          }}
        />
        <PageSectionDivider />
        {this.props.userApplicationsOrgs &&
          this.props.userApplicationsOrgs.length != 0 &&
          this.props.userApplicationsOrgs.map((organizationObject: any) => {
            const { organization, applications } = organizationObject;

            return (
              <>
                <OrgDropDown>
                  {this.props.currentUser && (
                    <CustomizedDropdown
                      {...DropdownProps(
                        this.props.currentUser,
                        organization.name,
                        organization.id,
                      )}
                    />
                  )}
                  <FormDialogComponent
                    trigger={<Button text="Share" intent={"primary"} filled />}
                    Form={InviteUsersFormv2}
                    orgId={organization.id}
                    title={"Invite Users"}
                    setMaxWidth
                  />
                </OrgDropDown>
                <ApplicationCardsWrapper key={organization.id}>
                  <FormDialogComponent
                    permissions={organization.userPermissions}
                    permissionRequired={PERMISSION_TYPE.CREATE_APPLICATION}
                    trigger={
                      <ApplicationAddCardWrapper>
                        <Icon
                          icon="plus"
                          iconSize={70}
                          className="createIcon"
                        />
                        <div className="createnew">Create New</div>
                      </ApplicationAddCardWrapper>
                    }
                    Form={CreateApplicationForm}
                    orgId={organization.id}
                    title={"Create Application"}
                  />
                  {applications.map((application: any) => {
                    return (
                      application.pages?.length > 0 && (
                        <ApplicationCard
                          key={application.id}
                          application={application}
                          delete={this.props.deleteApplication}
                        />
                      )
                    );
                  })}
                  <PageSectionDivider />
                </ApplicationCardsWrapper>
              </>
            );
          })}
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
  userApplicationsOrgs: getUserApplicationsOrgsList(state),
  currentUser: getCurrentUser(state),
});

const mapDispatchToProps = (dispatch: any) => ({
  fetchApplications: () =>
    dispatch({ type: ReduxActionTypes.FETCH_APPLICATION_LIST_INIT }),
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
  deleteApplication: (applicationId: string) => {
    if (applicationId && applicationId.length > 0) {
      dispatch({
        type: ReduxActionTypes.DELETE_APPLICATION_INIT,
        payload: {
          applicationId,
        },
      });
    }
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(Applications);
