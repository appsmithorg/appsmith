import React, { useEffect, useState } from "react";
import {
  addAndFetchMockDatasourceStructure,
  fetchDatasourceStructure,
  fetchGheetSpreadsheets,
} from "actions/datasourceActions";
import type { ExplorerURLParams } from "@appsmith/pages/Editor/Explorer/helpers";
import { INTEGRATION_TABS } from "constants/routes";
import { PluginPackageName } from "entities/Action";
import type { Datasource, MockDatasource } from "entities/Datasource";
import { useContext, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router";
import { integrationEditorURL } from "RouteBuilder";
import {
  getActionsForCurrentPage,
  getDatasourceLoading,
  getDatasources,
  getMockDatasources,
  getPluginIdPackageNamesMap,
  getPluginImages,
} from "selectors/entitiesSelector";
import history from "utils/history";
import WidgetQueryGeneratorRegistry from "utils/WidgetQueryGeneratorRegistry";
import { WidgetQueryGeneratorFormContext } from "../..";
import { Binding, DatasourceImage, ImageWrapper } from "../../styles";
import { Icon } from "design-system";
import type { DropdownOptions } from "pages/Editor/GeneratePage/components/constants";
import type { DropdownOptionType } from "../../types";
import { invert } from "lodash";
import { Colors } from "constants/Colors";

export function useDatasource() {
  const { addBinding, addSnippet, config, propertyValue, updateConfig } =
    useContext(WidgetQueryGeneratorFormContext);

  const dispatch = useDispatch();

  const [isMockDatasource, setIsMockDatasource] = useState(false);

  const pluginsPackageNamesMap = useSelector(getPluginIdPackageNamesMap);

  const pluginImages = useSelector(getPluginImages);

  const datasources: Datasource[] = useSelector(getDatasources);

  const isDatasourceLoading = useSelector(getDatasourceLoading);

  const mockDatasources: MockDatasource[] = useSelector(getMockDatasources);

  const datasourceOptions: DropdownOptions = useMemo(() => {
    const availableDatasources = datasources.filter(({ pluginId }) =>
      WidgetQueryGeneratorRegistry.has(pluginsPackageNamesMap[pluginId]),
    );

    if (availableDatasources.length) {
      return availableDatasources.map((datasource) => ({
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
          if (config.datasource !== valueOption?.id) {
            const pluginId: string = valueOption?.data.pluginId;
            updateConfig("datasource", valueOption?.id);

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
    } else {
      return mockDatasources
        .filter(({ packageName }) =>
          WidgetQueryGeneratorRegistry.has(packageName),
        )
        .map((datasource) => ({
          id: datasource.name,
          label: datasource.name,
          value: datasource.name,
          data: {
            pluginId: invert(pluginsPackageNamesMap)[
              datasource.packageName as string
            ],
            pluginPackageName: datasource.packageName,
          },
          icon: (
            <ImageWrapper>
              <DatasourceImage
                alt=""
                className="dataSourceImage"
                src={
                  pluginImages[
                    invert(pluginsPackageNamesMap)[
                      datasource.packageName as string
                    ]
                  ]
                }
              />
            </ImageWrapper>
          ),
          onSelect: function (
            value?: string,
            valueOption?: DropdownOptionType,
          ) {
            updateConfig("datasource", valueOption?.id);
            setIsMockDatasource(true);

            if (valueOption?.id) {
              dispatch(addAndFetchMockDatasourceStructure(datasource));
            }
          },
        }));
    }
  }, [
    datasources,
    updateConfig,
    pluginsPackageNamesMap,
    config,
    dispatch,
    mockDatasources,
    isDatasourceLoading,
  ]);

  const { pageId: currentPageId } = useParams<ExplorerURLParams>();

  const otherOptions = useMemo(() => {
    return [
      {
        icon: <Icon name="plus" size="md" />,
        id: "Connect New Datasource",
        label: "Connect New Datasource",
        value: "Connect New Datasource",
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
        icon: <Icon name="code" size="md" />,
        onSelect: addSnippet,
      },
      {
        id: "Insert Binding",
        label: "Insert Binding",
        value: "Insert Binding",
        icon: <Binding>{"{ }"}</Binding>,
        onSelect: () => addBinding("{{}}", true),
      },
    ];
  }, [currentPageId, history]);

  const queries = useSelector(getActionsForCurrentPage);

  const queryOptions = useMemo(() => {
    return queries.map((query) => ({
      id: query.config.id,
      label: query.config.name,
      value: `{{${query.config.name}.data}}`,
      icon: (
        <ImageWrapper>
          <DatasourceImage
            alt=""
            className="dataSourceImage"
            src={pluginImages[query.config.pluginId]}
          />
        </ImageWrapper>
      ),
      onSelect: function (value?: string, valueOption?: DropdownOptionType) {
        addBinding(valueOption?.value, false);
      },
    }));
  }, [queries, pluginImages, addBinding]);

  useEffect(() => {
    if (
      isMockDatasource &&
      !isDatasourceLoading &&
      datasourceOptions.length === 1
    ) {
      setIsMockDatasource(false);
      updateConfig("datasource", datasourceOptions[0].id);
    }
  }, [isMockDatasource, isDatasourceLoading, datasourceOptions]);

  return {
    datasourceOptions,
    otherOptions,
    selected: (() => {
      if (config.datasource) {
        return datasourceOptions.find(
          (option) => option.id === config.datasource,
        );
      } else if (propertyValue) {
        return queryOptions.find((option) => option.value === propertyValue);
      }
    })(),
    queryOptions,
  };
}
