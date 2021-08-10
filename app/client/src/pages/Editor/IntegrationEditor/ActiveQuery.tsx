import React from "react";
import styled from "styled-components";
import { Spinner } from "@blueprintjs/core";
import { connect } from "react-redux";
import { AppState } from "reducers";
import { createNewQueryName } from "utils/AppsmithUtils";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import { Datasource } from "entities/Datasource";
import { createActionRequest } from "actions/pluginActionActions";
import { QueryAction } from "entities/Action";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import DatasourceCard from "./DatasourceCard";

const QueryHomePage = styled.div`
  padding: 5px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  height: calc(100vh - ${(props) => props.theme.smallHeaderHeight});

  .sectionHeader {
    font-weight: ${(props) => props.theme.fontWeights[2]};
    font-size: ${(props) => props.theme.fontSizes[4]}px;
    margin-top: 10px;
  }
`;

const LoadingContainer = styled(CenteredWrapper)`
  height: 50%;
`;

type QueryHomeScreenProps = {
  dataSources: Datasource[];
  applicationId: string;
  pageId: string;
  createAction: (data: Partial<QueryAction> & { eventData: any }) => void;
  actions: ActionDataState;
  isCreating: boolean;
  location: {
    search: string;
  };
  history: {
    replace: (data: string) => void;
    push: (data: string) => void;
  };
};

class QueryHomeScreen extends React.Component<QueryHomeScreenProps> {
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
        pluginId: dataSource.pluginId,
        actionConfiguration: {},
      });
    }
  };

  render() {
    const { dataSources, isCreating } = this.props;

    if (isCreating) {
      return (
        <LoadingContainer>
          <Spinner size={30} />
        </LoadingContainer>
      );
    }

    return (
      <QueryHomePage>
        {dataSources.map((datasource) => {
          return (
            <DatasourceCard
              datasource={datasource}
              key={datasource.id}
              onCreateQuery={this.handleCreateNewQuery}
            />
          );
        })}
      </QueryHomePage>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  actions: state.entities.actions,
});

const mapDispatchToProps = (dispatch: any) => ({
  createAction: (data: Partial<QueryAction> & { eventData: any }) => {
    dispatch(createActionRequest(data));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(QueryHomeScreen);
