import React, { Component } from "react";
import styled from "styled-components";
import { connect } from "react-redux";
import { AppState } from "reducers";
import { Card, Icon } from "@blueprintjs/core";
import {
  getApplicationList,
  getIsFetchingApplications,
  getIsCreatingApplication,
  getCreateApplicationError,
  getIsDeletingApplication,
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
import { CREATE_APPLICATION_FORM_NAME } from "constants/forms";
import { DELETING_APPLICATION } from "constants/messages";
import { AppToaster } from "components/editorComponents/ToastComponent";
import AnalyticsUtil from "utils/AnalyticsUtil";
import FormDialogComponent from "components/editorComponents/form/FormDialogComponent";
import OrganizationListMockResponse from "mockResponses/OrganisationListResponse";

const ApplicationCardsWrapper = styled.div`
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
  align-items: space-evenly;
`;

const Wrapper = styled(Card)`
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
};

class Applications extends Component<ApplicationProps> {
  componentDidMount() {
    this.props.fetchApplications();
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
            form: CreateApplicationForm,
            title: "Create Application",
            formName: CREATE_APPLICATION_FORM_NAME,
            formSubmitIntent: "primary",
            isAdding: this.props.isCreatingApplication,
            errorAdding: this.props.createApplicationError,
            formSubmitText: "Create",
            onClick: () => {
              AnalyticsUtil.logEvent("CREATE_APP_CLICK", {});
            },
          }}
          search={{
            placeholder: "Search",
            queryFn: this.props.searchApplications,
          }}
        />
        <PageSectionDivider />
        {OrganizationListMockResponse.map((organizationObject: any) => {
          const { organization, applications } = organizationObject;
          const hasCreateApplicationPemission = organization.userPermissions.includes(
            "manage:orgApplications",
          );

          return (
            <>
              <p>{organization.name}</p>
              <ApplicationCardsWrapper key={organization.id}>
                {hasCreateApplicationPemission && (
                  <FormDialogComponent
                    trigger={
                      <Wrapper>
                        <Icon
                          icon="plus"
                          iconSize={20}
                          className="createIcon"
                        />
                      </Wrapper>
                    }
                    Form={CreateApplicationForm}
                    title={"Create Application"}
                  />
                )}
                {applications.map((application: any) => {
                  return (
                    application.pages?.length > 0 && (
                      <ApplicationCard
                        key={application.id}
                        loading={this.props.isFetchingApplications}
                        application={application}
                        delete={this.props.deleteApplication}
                      />
                    )
                  );
                })}
              </ApplicationCardsWrapper>
            </>
          );
        })}
        {/* <ApplicationCardsWrapper>
          <FormDialogComponent
            trigger={<Wrapper>Hello</Wrapper>}
            Form={CreateApplicationForm}
            title={"Create Application"}
          />
          {applicationList.map((application: ApplicationPayload) => {
            return (
              application.pageCount > 0 && (
                <ApplicationCard
                  key={application.id}
                  loading={this.props.isFetchingApplications}
                  application={application}
                  delete={this.props.deleteApplication}
                />
              )
            );
          })}
        </ApplicationCardsWrapper> */}
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
});

const mapDispatchToProps = (dispatch: any) => ({
  fetchApplications: () =>
    dispatch({ type: ReduxActionTypes.FETCH_APPLICATION_LIST_INIT }),
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
