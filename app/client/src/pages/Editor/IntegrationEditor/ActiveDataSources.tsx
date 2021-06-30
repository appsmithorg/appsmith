import React from "react";
import styled from "styled-components";
import { Spinner } from "@blueprintjs/core";
import { connect } from "react-redux";
import { AppState } from "reducers";
import { createNewQueryName } from "utils/AppsmithUtils";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import { Datasource } from "entities/Datasource";
import { createActionRequest } from "actions/actionActions";
import { QueryAction } from "entities/Action";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import DatasourceCard from "./DatasourceCard";
import Text, { TextType } from "components/ads/Text";
import Button, { Category, Size } from "components/ads/Button";
import { Colors } from "constants/Colors";

const QueryHomePage = styled.div`
  ::-webkit-scrollbar {
    width: 4px;
  }

  /* Track */
  ::-webkit-scrollbar-track {
    border-radius: 10px;
  }

  /* Handle */
  ::-webkit-scrollbar-thumb {
    background: ${Colors.MYSTIC};
    border-radius: 10px;
  }

  /* Handle on hover */
  ::-webkit-scrollbar-thumb:hover {
    background: ${Colors.PORCELAIN};
  }
  padding: 5px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  height: calc(
    100vh - ${(props) => props.theme.integrationsPageUnusableHeight}
  );

  .sectionHeader {
    font-weight: ${(props) => props.theme.fontWeights[2]};
    font-size: ${(props) => props.theme.fontSizes[4]}px;
    margin-top: 10px;
  }
`;

const CreateButton = styled(Button)`
  display: inline;
  padding: 4px 8px;
`;

const EmptyActiveDatasource = styled.div`
  height: calc(
    100vh - ${(props) => props.theme.integrationsPageUnusableHeight}
  );
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LoadingContainer = styled(CenteredWrapper)`
  height: 50%;
`;

type ActiveDataSourceProps = {
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
  onCreateNew: () => void;
};

class ActiveDataSources extends React.Component<ActiveDataSourceProps> {
  handleCreateNewQuery = (dataSource: Datasource) => {
    const { actions, pageId } = this.props;
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

    if (dataSources.length === 0) {
      return (
        <EmptyActiveDatasource>
          <Text cypressSelector="t--empty-datasource-list" type={TextType.H3}>
            No active integrations found.{" "}
            <CreateButton
              category={Category.primary}
              onClick={this.props.onCreateNew}
              size={Size.medium}
              tag="button"
              text="Create New"
            />
          </Text>
        </EmptyActiveDatasource>
      );
    }

    return (
      <QueryHomePage className="t--active-datasource-list">
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

export default connect(mapStateToProps, mapDispatchToProps)(ActiveDataSources);
