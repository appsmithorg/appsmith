import React, { Component } from "react";
import styled from "styled-components";
import { connect } from "react-redux";
import { AppState } from "reducers";
import {
  getApplicationList,
  getIsFetchingApplications,
  getIsCreatingApplication,
  getCreateApplicationError,
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

const ApplicationCardsWrapper = styled.div`
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
  align-items: space-evenly;
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
        <SubHeader
          add={{
            form: <CreateApplicationForm />,
            title: "Create New App",
            formName: CREATE_APPLICATION_FORM_NAME,
            formSubmitIntent: "primary",
            isAdding:
              this.props.isCreatingApplication ||
              !!this.props.createApplicationError,
            errorAdding: this.props.createApplicationError,
          }}
          search={{
            placeholder: "Search",
            queryFn: this.props.searchApplications,
          }}
        />
        <PageSectionDivider />
        <ApplicationCardsWrapper>
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
        </ApplicationCardsWrapper>
      </PageWrapper>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  applicationList: getApplicationList(state),
  isFetchingApplications: getIsFetchingApplications(state),
  isCreatingApplication: getIsCreatingApplication(state),
  createApplicationError: getCreateApplicationError(state),
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
