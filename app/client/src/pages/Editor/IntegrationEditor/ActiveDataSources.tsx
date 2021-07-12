import React from "react";
import styled from "styled-components";
import { connect } from "react-redux";
import { AppState } from "reducers";
import { createNewQueryName } from "utils/AppsmithUtils";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import { Datasource } from "entities/Datasource";
import { createActionRequest } from "actions/actionActions";
import { Action, ApiActionConfig, PluginType } from "entities/Action";
import DatasourceCard from "./DatasourceCard";
import Text, { TextType } from "components/ads/Text";
import Button, { Category, Size } from "components/ads/Button";
import { thinScrollbar } from "constants/DefaultTheme";
import { Toaster } from "../../../components/ads/Toast";
import { Variant } from "../../../components/ads/common";
import { DEFAULT_API_ACTION_CONFIG } from "../../../constants/ApiEditorConstants";

const QueryHomePage = styled.div`
  ${thinScrollbar};
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

type ActiveDataSourceProps = {
  dataSources: Datasource[];
  applicationId: string;
  pageId: string;
  createAction: (data: Partial<Action> & { eventData: any }) => void;
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
  handleCreateNewQuery = (dataSource: Datasource, pluginType: PluginType) => {
    const { actions, pageId } = this.props;

    if (
      pluginType === "API" &&
      (!dataSource ||
        !dataSource.datasourceConfiguration ||
        !dataSource.datasourceConfiguration.url)
    ) {
      Toaster.show({
        text: "Unable to create API. Try adding a url to the datasource",
        variant: Variant.danger,
      });
      return;
    }
    if (pageId) {
      const newQueryName = createNewQueryName(actions, pageId);

      const headers = dataSource?.datasourceConfiguration?.headers ?? [];
      const defaultApiActionConfig: ApiActionConfig = {
        ...DEFAULT_API_ACTION_CONFIG,
        headers: headers.length ? headers : DEFAULT_API_ACTION_CONFIG.headers,
      };

      this.props.createAction({
        name: newQueryName,
        pageId,
        datasource: {
          id: dataSource.id,
        },
        eventData: {
          actionType: "Query",
          from: "datasources",
          dataSource: dataSource.name,
        },
        pluginId: dataSource.pluginId,
        actionConfiguration: pluginType === "API" ? defaultApiActionConfig : {},
      });
    }
  };

  render() {
    const { dataSources, isCreating } = this.props;

    // if (isCreating) {
    //   return (
    //     <LoadingContainer>
    //       <Spinner size={30} />
    //     </LoadingContainer>
    //   );
    // }

    if (dataSources.length === 0) {
      return (
        <EmptyActiveDatasource>
          <Text cypressSelector="t--empty-datasource-list" type={TextType.H3}>
            No active datasources found.{" "}
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
        {dataSources.map((datasource, idx) => {
          return (
            <DatasourceCard
              datasource={datasource}
              isCreating={isCreating}
              key={`${datasource.id}_${idx}`}
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
  createAction: (data: Partial<Action> & { eventData: any }) => {
    dispatch(createActionRequest(data));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(ActiveDataSources);
