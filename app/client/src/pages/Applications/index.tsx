import React, { Component } from "react";
import styled from "styled-components";
import { connect } from "react-redux";
import { withRouter } from "react-router";
import {
  getApplicationBuilderURL,
  getApplicationViewerURL,
} from "../../constants/routes";
import { AppState } from "../../reducers";
import {
  getApplicationList,
  getIsFetchingApplications,
  getIsCreatingApplication,
} from "../../selectors/applicationSelectors";
import {
  ReduxActionTypes,
  ApplicationPayload,
} from "../../constants/ReduxActionConstants";
import { Card, Spinner, Tooltip } from "@blueprintjs/core";
import { ControlIcons } from "../../icons/ControlIcons";
import { theme } from "../../constants/DefaultTheme";
import ApplicationsHeader from "./ApplicationsHeader";
import CreateApplicationForm from "./CreateApplicationForm";

const APPLICATION_CONTROL_FONTSIZE_INDEX = 7;

const ApplicationsBody = styled.section`
  width: 100vw;
  min-height: calc(100vh - ${props => props.theme.headerHeight});
  display: flex;
  justify-content: center;
  align-items: center;
  background: white;
`;

const ApplicationCardsWrapper = styled.div`
  display: flex;
  flex-flow: row wrap;
  justify-content: center;
  align-items: space-around;
  width: 80%;
`;
const ApplicationCard = styled(Card)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: ${props => props.theme.card.minWidth}px;
  min-height: ${props => props.theme.card.minHeight}px;
  position: relative;
  margin-bottom: ${props => props.theme.spaces[2]}px;
  margin-right: ${props => props.theme.spaces[2]}px;
  &:hover {
    & div.controls {
      display: flex;
    }
  }
`;
const ApplicationTitle = styled.h1`
  font-size: ${props => props.theme.fontSizes[7]}px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
`;
const ApplicationControls = styled.div`
  display: none;
  flex-flow: row nowrap;
  justify-content: space-around;
`;

const Control = styled.button<{ fixed?: boolean }>`
  outline: none;
  background: none;
  border: none;
  cursor: pointer;
  position: ${props => (props.fixed ? "absolute" : "auto")};
  right: ${props => props.theme.spaces[2]}px;
  top: ${props => props.theme.spaces[2]}px;
`;

const editControlIcon = ControlIcons.EDIT_CONTROL({
  width: theme.fontSizes[APPLICATION_CONTROL_FONTSIZE_INDEX],
  height: theme.fontSizes[APPLICATION_CONTROL_FONTSIZE_INDEX],
});

const deleteControlIcon = ControlIcons.DELETE_CONTROL({
  width: theme.fontSizes[APPLICATION_CONTROL_FONTSIZE_INDEX],
  height: theme.fontSizes[APPLICATION_CONTROL_FONTSIZE_INDEX],
  background: theme.colors.error,
});

const viewControlIcon = ControlIcons.VIEW_CONTROL({
  width: theme.fontSizes[APPLICATION_CONTROL_FONTSIZE_INDEX],
  height: theme.fontSizes[APPLICATION_CONTROL_FONTSIZE_INDEX],
});

type ApplicationProps = {
  applicationList: ApplicationPayload[];
  fetchApplications: () => void;
  createApplication: (appName: string) => void;
  isCreatingApplication: boolean;
  history: any;
};

class Applications extends Component<ApplicationProps> {
  handleEditApplication = (applicationId: string) => () => {
    this.props.history.push(getApplicationBuilderURL(applicationId));
  };

  handleViewApplication = (applicationId: string, pageId?: string) => () => {
    this.props.history.push(getApplicationViewerURL(applicationId, pageId));
  };

  renderApplicationCard = (application: ApplicationPayload) => {
    return (
      <ApplicationCard interactive key={application.id}>
        <ApplicationTitle>{application.name}</ApplicationTitle>
        <ApplicationControls className="controls">
          <Control fixed>
            <Tooltip content="Delete Application" hoverOpenDelay={500}>
              {deleteControlIcon}
            </Tooltip>
          </Control>
          <Control
            onClick={this.handleViewApplication(
              application.id,
              application.defaultPageId,
            )}
          >
            <Tooltip content="View Application" hoverOpenDelay={500}>
              {viewControlIcon}
            </Tooltip>
          </Control>
          <Control onClick={this.handleEditApplication(application.id)}>
            <Tooltip content="Edit Application" hoverOpenDelay={500}>
              {editControlIcon}
            </Tooltip>
          </Control>
        </ApplicationControls>
      </ApplicationCard>
    );
  };
  componentDidMount() {
    this.props.fetchApplications();
  }
  public render() {
    return (
      <div>
        <ApplicationsHeader
          add={{
            form: (
              <CreateApplicationForm
                onCreate={this.props.createApplication}
                creating={this.props.isCreatingApplication}
              />
            ),
            title: "Create Application",
          }}
        />
        <ApplicationsBody>
          {this.props.applicationList ? (
            <ApplicationCardsWrapper>
              {this.props.applicationList.map(this.renderApplicationCard)}
            </ApplicationCardsWrapper>
          ) : (
            <Spinner />
          )}
        </ApplicationsBody>
      </div>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  applicationList: getApplicationList(state),
  isFetchingApplications: getIsFetchingApplications(state),
  isCreatingApplication: getIsCreatingApplication(state),
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
