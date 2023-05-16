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
import { Icon } from "design-system-new";
import type { DropdownOptionType } from "../../types";
import { invert } from "lodash";
import { Colors } from "constants/Colors";
import { DropdownOption } from "./DropdownOption";
import { getisOneClickBindingConnectingForWidget } from "selectors/oneClickBindingSelectors";

export function useDatasource() {
  const {
    addBinding,
    addSnippet,
    config,
    errorMsg,
    isSourceOpen,
    onSourceClose,
    propertyValue,
    updateConfig,
    widgetId,
  } = useContext(WidgetQueryGeneratorFormContext);

  const dispatch = useDispatch();

  const [isMockDatasource, setIsMockDatasource] = useState(false);

  const pluginsPackageNamesMap = useSelector(getPluginIdPackageNamesMap);

  const pluginImages = useSelector(getPluginImages);

  const datasources: Datasource[] = useSelector(getDatasources);

  const isDatasourceLoading = useSelector(getDatasourceLoading);

  const mockDatasources: MockDatasource[] = useSelector(getMockDatasources);

  const [actualDatasourceOptions, mockDatasourceOptions] = useMemo(() => {
    const availableDatasources = datasources.filter(({ pluginId }) =>
      WidgetQueryGeneratorRegistry.has(pluginsPackageNamesMap[pluginId]),
    );

    let datasourceOptions: DropdownOptionType[] = [];

    if (availableDatasources.length) {
      datasourceOptions = datasourceOptions.concat(
        availableDatasources.map((datasource) => ({
          id: datasource.id,
          label: datasource.name,
          value: datasource.name,
          data: {
            pluginId: datasource.pluginId,
            isValid: datasource.isValid,
            pluginPackageName: pluginsPackageNamesMap[datasource.pluginId],
            isSample: false,
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
          onSelect: function (
            value?: string,
            valueOption?: DropdownOptionType,
          ) {
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
        })),
      );
    }

    let mockDatasourceOptions: DropdownOptionType[] = [];

    if (mockDatasources.length) {
      mockDatasourceOptions = mockDatasourceOptions.concat(
        mockDatasources
          .filter(({ packageName }) =>
            WidgetQueryGeneratorRegistry.has(packageName),
          )
          .map((datasource) => ({
            id: "sample " + datasource.name,
            label: "sample " + datasource.name,
            value: "sample " + datasource.name,
            data: {
              pluginId: invert(pluginsPackageNamesMap)[
                datasource.packageName as string
              ],
              pluginPackageName: datasource.packageName,
              isSample: true,
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
          })),
      );
    }

    return [datasourceOptions, mockDatasourceOptions];
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
        id: "Connect New Datasource",
        label: "Connect New Datasource",
        value: "Connect New Datasource",
        icon: <Icon color={Colors.GRAY} name="add-box-line" size="xl" />,
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
        icon: <Icon color={Colors.GRAY} name="query" size="xl" />,
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
  }, [currentPageId, history, addBinding, addSnippet]);

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
        updateConfig("datasource", "");
      },
    }));
  }, [queries, pluginImages, addBinding]);

  const datasourceOptions = useMemo(() => {
    return [...actualDatasourceOptions, ...mockDatasourceOptions];
  }, [actualDatasourceOptions, mockDatasourceOptions]);

  /*
   * When user selects the sample datasource and the plaform creates a new datasource out of it
   * we need to choose the newly created datasource as the selected value.
   */
  useEffect(() => {
    if (
      isMockDatasource &&
      !isDatasourceLoading &&
      actualDatasourceOptions.length
    ) {
      setIsMockDatasource(false);
      updateConfig(
        "datasource",
        actualDatasourceOptions[actualDatasourceOptions.length - 1].id,
      );
    }
  }, [isMockDatasource, isDatasourceLoading, datasourceOptions]);

  const isConnecting = useSelector(
    getisOneClickBindingConnectingForWidget(widgetId),
  );

  return {
    datasourceOptions,
    otherOptions,
    selected: (() => {
      let source;

      if (config.datasource) {
        source = datasourceOptions.find(
          (option) => option.id === config.datasource,
        );
      } else if (propertyValue) {
        source = queryOptions.find((option) => option.value === propertyValue);
      }

      if (source) {
        return {
          key: source.id,
          label: (
            <DropdownOption
              label={source?.label?.replace("sample ", "")}
              leftIcon={source?.icon}
            />
          ),
        };
      }
    })(),
    queryOptions,
    isSourceOpen,
    onSourceClose,
    error: config.datasource ? "" : errorMsg,
    disabled: isConnecting,
  };
}
