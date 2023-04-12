import React from "react";
import {
  fetchDatasourceStructure,
  fetchGheetSpreadsheets,
} from "actions/datasourceActions";
import type { ExplorerURLParams } from "ce/pages/Editor/Explorer/helpers";
import { INTEGRATION_TABS } from "constants/routes";
import { PluginPackageName } from "entities/Action";
import type { Datasource } from "entities/Datasource";
import { useContext, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router";
import { integrationEditorURL } from "RouteBuilder";
import {
  getDatasources,
  getPluginIdPackageNamesMap,
  getPluginImages,
} from "selectors/entitiesSelector";
import history from "utils/history";
import WidgetQueryGeneratorRegistry from "utils/WidgetQueryGeneratorRegistry";
import { WidgetQueryGeneratorFormContext } from "../..";
import { DatasourceImage, ImageWrapper } from "../../styles";
import { Icon, IconSize } from "design-system-old";
import type { DropdownOptions } from "pages/Editor/GeneratePage/components/constants";
import type { DropdownOptionType } from "../../types";

export function useDatasource() {
  const { addBinding, addSnippet, config, updateConfig } = useContext(
    WidgetQueryGeneratorFormContext,
  );

  const dispatch = useDispatch();

  const pluginsPackageNamesMap = useSelector(getPluginIdPackageNamesMap);

  const pluginImages = useSelector(getPluginImages);

  const datasources: Datasource[] = useSelector(getDatasources);

  const datasourceOptions: DropdownOptions = useMemo(() => {
    return datasources
      .filter(({ pluginId }) => WidgetQueryGeneratorRegistry.has(pluginId))
      .map((datasource) => ({
        id: datasource.id,
        label: datasource.name,
        value: datasource.name,
        data: {
          pluginId: datasource.pluginId,
          isValid: datasource.isValid,
          pluginPackageName: pluginsPackageNamesMap[datasource.pluginId],
        },
        icon: (
          <ImageWrapper>
            <DatasourceImage
              alt=""
              className="dataSourceImage"
              src={pluginImages[datasource.pluginId]}
            />
          </ImageWrapper>
        ),
        onSelect: function (value?: string, valueOption?: DropdownOptionType) {
          if (config.datasource.id !== valueOption?.id) {
            const pluginId: string = valueOption?.data.pluginId;
            updateConfig("datasource", valueOption);

            if (valueOption?.id) {
              switch (pluginsPackageNamesMap[pluginId]) {
                case PluginPackageName.GOOGLE_SHEETS:
                  dispatch(
                    fetchGheetSpreadsheets({
                      datasourceId: valueOption.id,
                      pluginId: pluginId,
                    }),
                  );
                  break;
                default: {
                  dispatch(fetchDatasourceStructure(valueOption.id, true));
                  break;
                }
              }
            }
          }
        },
      }));
  }, [datasources, updateConfig, pluginsPackageNamesMap, config, dispatch]);

  const { pageId: currentPageId } = useParams<ExplorerURLParams>();

  const otherOptions = useMemo(() => {
    return [
      {
        id: "Connect New Datasource",
        label: "Connect New Datasource",
        value: "Connect New Datasource",
        icon: <Icon name="plus" size={IconSize.XXXL} />,
        onSelect: () => {
          history.push(
            integrationEditorURL({
              pageId: currentPageId,
              selectedTab: INTEGRATION_TABS.NEW,
            }),
          );
        },
      },
      {
        id: "Insert Snippet",
        label: "Insert Snippet",
        value: "Insert Snippet",
        icon: <Icon name="code" size={IconSize.XXXL} />,
        onSelect: addSnippet,
      },
      {
        id: "Insert Binding",
        label: "Insert Binding",
        value: "Insert Binding",
        icon: <Icon name="code" size={IconSize.XXXL} />,
        onSelect: addBinding,
      },
    ];
  }, [currentPageId, history]);

  return {
    datasourceOptions,
    otherOptions,
    selected: config.datasource,
  };
}
