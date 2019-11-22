import React, { Component } from "react";
import styled from "styled-components";
import { connect } from "react-redux";
import { withRouter } from "react-router";
import { AppState } from "../../reducers";
import {
  getApplicationList,
  getIsFetchingApplications,
  getIsCreatingApplication,
  getCreateApplicationError,
} from "../../selectors/applicationSelectors";
import {
  ReduxActionTypes,
  ApplicationPayload,
} from "../../constants/ReduxActionConstants";
import { Divider } from "@blueprintjs/core";
import ApplicationsHeader from "./ApplicationsHeader";
import SubHeader from "pages/common/SubHeader";
import { getApplicationPayloads } from "mockComponentProps/ApplicationPayloads";
import ApplicationCard from "./ApplicationCard";
import CreateApplicationForm from "./CreateApplicationForm";
import { CREATE_APPLICATION_FORM_NAME } from "constants/forms";
import { noop } from "utils/AppsmithUtils";

const ApplicationsPageWrapper = styled.section`
  width: 100vw;
`;
const SectionDivider = styled(Divider)`
  margin: ${props => props.theme.spaces[11]}px auto;
  width: 100%;
`;
const ApplicationsBody = styled.div`
  width: 1224px;
  min-height: calc(100vh - ${props => props.theme.headerHeight});
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  margin: ${props => props.theme.spaces[12]}px auto;
  background: ${props => props.theme.colors.bodyBG};
`;

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
  history: any;
};

class Applications extends Component<ApplicationProps> {
  componentDidMount() {
    this.props.fetchApplications();
  }
  public render() {
    const applicationList = this.props.isFetchingApplications
      ? getApplicationPayloads(4)
      : this.props.applicationList;
    return (
      <ApplicationsPageWrapper>
        <ApplicationsHeader />
        <ApplicationsBody>
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
            }}
          />
          <SectionDivider />
          <ApplicationCardsWrapper>
            {applicationList.map((application: ApplicationPayload) => (
              <ApplicationCard
                key={application.id}
                loading={this.props.isFetchingApplications}
                application={application}
                share={noop}
                duplicate={noop}
                delete={noop}
              />
            ))}
          </ApplicationCardsWrapper>
        </ApplicationsBody>
      </ApplicationsPageWrapper>
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
});

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  )(Applications),
);
