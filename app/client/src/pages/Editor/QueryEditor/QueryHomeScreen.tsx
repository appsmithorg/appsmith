import React from "react";
import styled from "styled-components";
import { Spinner, Button } from "@blueprintjs/core";
import { connect } from "react-redux";
import { AppState } from "reducers";
import { createNewQueryName } from "utils/AppsmithUtils";
import { getPluginImages } from "selectors/entitiesSelector";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import { Datasource } from "entities/Datasource";
import { createActionRequest } from "actions/actionActions";
import { Page } from "constants/ReduxActionConstants";
import {
  QUERY_EDITOR_URL_WITH_SELECTED_PAGE_ID,
  DATA_SOURCES_EDITOR_URL,
} from "constants/routes";
import AddDatasourceSecurely from "./AddDatasourceSecurely";
import { QueryAction } from "entities/Action";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import DatasourceCard from "./DatasourceCard";
import { fetchDBPluginForms } from "actions/pluginActions";

const QueryHomePage = styled.div`
  padding: 20px;
  padding-top: 30px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  height: calc(100vh - ${(props) => props.theme.headerHeight});

  .sectionHeader {
    font-weight: ${(props) => props.theme.fontWeights[2]};
    font-size: ${(props) => props.theme.fontSizes[4]}px;
  }
`;

const LoadingContainer = styled(CenteredWrapper)`
  height: 50%;
`;

const AddDatasource = styled(Button)`
  padding: 23px;
  border: 2px solid #d6d6d6;
  justify-content: flex-start;
  font-size: 16px;
  font-weight: 500;
`;

const Boundary = styled.hr`
  border: 1px solid #d0d7dd;
  margin-top: 16px;
`;

type QueryHomeScreenProps = {
  dataSources: Datasource[];
  applicationId: string;
  pageId: string;
  createAction: (data: Partial<QueryAction> & { eventData: any }) => void;
  fetchDBPluginForms: () => void;
  actions: ActionDataState;
  isCreating: boolean;
  loadingDBFormConfigs: boolean;
  location: {
    search: string;
  };
  history: {
    replace: (data: string) => void;
    push: (data: string) => void;
  };
  pages: Page[];
  pluginImages: Record<string, string>;
};

class QueryHomeScreen extends React.Component<QueryHomeScreenProps> {
  componentDidMount() {
    this.props.fetchDBPluginForms();
  }

  handleCreateNewQuery = (dataSource: Datasource) => {
    const { actions, location } = this.props;
    const params: string = location.search;
    const pageId = new URLSearchParams(params).get("importTo");
    if (pageId) {
      const newQueryName = createNewQueryName(actions, pageId);

      this.props.createAction({
        name: newQueryName,
        pageId,
        datasource: {
          id: dataSource.id,
        },
        eventData: {
          actionType: "Query",
          from: "home-screen",
          dataSource: dataSource.name,
        },
        actionConfiguration: {},
      });
    }
  };

  render() {
    const {
      dataSources,
      applicationId,
      pageId,
      history,
      isCreating,
      location,
      loadingDBFormConfigs,
    } = this.props;

    const destinationPageId = new URLSearchParams(location.search).get(
      "importTo",
    );

    if (!destinationPageId) {
      history.push(
        QUERY_EDITOR_URL_WITH_SELECTED_PAGE_ID(applicationId, pageId, pageId),
      );
    }

    if (isCreating || loadingDBFormConfigs) {
      return (
        <LoadingContainer>
          <Spinner size={30} />
        </LoadingContainer>
      );
    }

    return (
      <QueryHomePage>
        <p className="sectionHeader">
          Select a datasource to query or create a new one
        </p>
        <Boundary />
        {dataSources.length < 2 ? (
          <AddDatasourceSecurely
            onAddDatasource={() => {
              history.push(DATA_SOURCES_EDITOR_URL(applicationId, pageId));
            }}
          />
        ) : (
          <AddDatasource
            className="t--add-datasource"
            onClick={() => {
              history.push(DATA_SOURCES_EDITOR_URL(applicationId, pageId));
            }}
            fill
            minimal
            text="New Datasource"
            icon={"plus"}
          />
        )}
        {dataSources.map((datasource) => {
          return (
            <DatasourceCard
              key={datasource.id}
              datasource={datasource}
              onCreateQuery={this.handleCreateNewQuery}
            />
          );
        })}
      </QueryHomePage>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  pluginImages: getPluginImages(state),
  actions: state.entities.actions,
  pages: state.entities.pageList.pages,
  loadingDBFormConfigs: state.entities.plugins.loadingDBFormConfigs,
});

const mapDispatchToProps = (dispatch: any) => ({
  createAction: (data: Partial<QueryAction> & { eventData: any }) => {
    dispatch(createActionRequest(data));
  },
  fetchDBPluginForms: () => {
    dispatch(fetchDBPluginForms());
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(QueryHomeScreen);
