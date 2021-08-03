import React, { useCallback, useMemo } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "reducers";
import { createNewApiName, createNewQueryName } from "utils/AppsmithUtils";
import { Datasource } from "entities/Datasource";
import { createActionRequest } from "actions/actionActions";
import { ApiActionConfig, PluginType } from "entities/Action";
import DatasourceCard from "./DatasourceCard";
import Text, { TextType } from "components/ads/Text";
import Button, { Category, Size } from "components/ads/Button";
import { thinScrollbar } from "constants/DefaultTheme";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import { DEFAULT_API_ACTION_CONFIG } from "constants/ApiEditorConstants";
import { keyBy } from "lodash";

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

type ActiveDataSourcesProps = {
  dataSources: Datasource[];
  applicationId: string;
  pageId: string;
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

function ActiveDataSources(props: ActiveDataSourcesProps) {
  const { dataSources, isCreating, pageId } = props;
  const dispatch = useDispatch();

  const actions = useSelector((state: AppState) => state.entities.actions);
  const plugins = useSelector((state: AppState) => {
    return state.entities.plugins.list;
  });
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);

  const handleCreateNewQuery = useCallback(
    (dataSource: Datasource, pluginType: PluginType) => {
      if (
        pluginType === PluginType.API &&
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
        const newActionName =
          pluginType === PluginType.DB
            ? createNewQueryName(actions, pageId)
            : createNewApiName(actions, pageId);

        const headers = dataSource?.datasourceConfiguration?.headers ?? [];
        const defaultApiActionConfig: ApiActionConfig = {
          ...DEFAULT_API_ACTION_CONFIG,
          headers: headers.length ? headers : DEFAULT_API_ACTION_CONFIG.headers,
        };
        const payload = {
          name: newActionName,
          pageId,
          datasource: {
            id: dataSource.id,
          },
          eventData: {
            actionType: pluginType === PluginType.DB ? "Query" : "API",
            from: "datasources",
            dataSource: dataSource.name,
          },
          pluginId: dataSource.pluginId,
          actionConfiguration:
            pluginType === PluginType.API ? defaultApiActionConfig : {},
        };

        dispatch(createActionRequest(payload));
      }
    },
    [dispatch, actions],
  );

  if (dataSources.length === 0) {
    return (
      <EmptyActiveDatasource>
        <Text cypressSelector="t--empty-datasource-list" type={TextType.H3}>
          No active datasources found.{" "}
          <CreateButton
            category={Category.primary}
            onClick={props.onCreateNew}
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
            onCreateQuery={handleCreateNewQuery}
            plugin={pluginGroups[datasource.pluginId]}
          />
        );
      })}
    </QueryHomePage>
  );
}

export default ActiveDataSources;
