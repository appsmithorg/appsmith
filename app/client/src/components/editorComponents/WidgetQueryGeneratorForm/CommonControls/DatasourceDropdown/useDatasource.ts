import {
  fetchDatasourceStructure,
  fetchGheetSpreadsheets,
} from "actions/datasourceActions";
import type { ExplorerURLParams } from "ce/pages/Editor/Explorer/helpers";
import { INTEGRATION_TABS } from "constants/routes";
import type { DropdownOption } from "design-system-old";
import { PluginPackageName } from "entities/Action";
import type { Datasource } from "entities/Datasource";
import type { DropdownOptions } from "pages/Editor/GeneratePage/components/constants";
import { useCallback, useContext, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router";
import { integrationEditorURL } from "RouteBuilder";
import {
  getDatasources,
  getPluginIdPackageNamesMap,
} from "selectors/entitiesSelector";
import history from "utils/history";
import { CONNECT_NEW_DATASOURCE_OPTION } from ".";
import { QueryGeneratorFormContext } from "../..";

export function useDatasource() {
  const { config, updateConfig } = useContext(QueryGeneratorFormContext);

  const dispatch = useDispatch();

  const plugins = useSelector(getPluginIdPackageNamesMap);

  const datasources: Datasource[] = useSelector(getDatasources);

  const options: DropdownOptions = useMemo(() => {
    return [
      CONNECT_NEW_DATASOURCE_OPTION,
      ...datasources.map(({ id, isValid, name, pluginId }) => ({
        id,
        label: name,
        value: name,
        data: {
          pluginId,
          isValid,
        },
      })),
    ];
  }, [datasources]);

  const onSelect = useCallback(
    (
      datasource: string | undefined,
      dataSourceObj: DropdownOption | undefined,
    ) => {
      if (
        datasource &&
        dataSourceObj &&
        config.datasource.id !== dataSourceObj.id
      ) {
        const pluginId: string = dataSourceObj.data.pluginId;
        updateConfig("datasource", dataSourceObj);

        if (dataSourceObj.id) {
          switch (plugins[pluginId]) {
            case PluginPackageName.GOOGLE_SHEETS:
              dispatch(
                fetchGheetSpreadsheets({
                  datasourceId: dataSourceObj.id,
                  pluginId: dataSourceObj.data.pluginId,
                }),
              );
              break;
            default: {
              dispatch(fetchDatasourceStructure(dataSourceObj.id, true));
              break;
            }
          }
        }
      }
    },
    [],
  );

  const { pageId: currentPageId } = useParams<ExplorerURLParams>();

  const routeToCreateNewDatasource = useCallback(() => {
    history.push(
      integrationEditorURL({
        pageId: currentPageId,
        selectedTab: INTEGRATION_TABS.NEW,
      }),
    );
  }, []);

  return {
    options,
    routeToCreateNewDatasource,
    onSelect,
    selected: config.datasource,
  };
}
