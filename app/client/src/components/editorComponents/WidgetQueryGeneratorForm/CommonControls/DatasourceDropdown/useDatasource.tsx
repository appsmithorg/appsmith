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
  getPlugins,
} from "selectors/entitiesSelector";
import history from "utils/history";
import WidgetQueryGeneratorRegistry from "utils/WidgetQueryGeneratorRegistry";
import { WidgetQueryGeneratorFormContext } from "../..";
import { Binding, DatasourceImage, ImageWrapper } from "../../styles";
import { Icon } from "design-system";
import type { DropdownOptionType } from "../../types";
import { invert } from "lodash";
import { DropdownOption } from "./DropdownOption";
import { getisOneClickBindingConnectingForWidget } from "selectors/oneClickBindingSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getWidget } from "sagas/selectors";
import type { AppState } from "@appsmith/reducers";
import { DatasourceCreateEntryPoints } from "constants/Datasource";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
import { isEnvironmentValid } from "@appsmith/utils/Environments";

export function useDatasource() {
  const {
    addBinding,
    addSnippet,
    config,
    errorMsg,
    isSourceOpen,
    onSourceClose,
    propertyName,
    propertyValue,
    updateConfig,
    widgetId,
  } = useContext(WidgetQueryGeneratorFormContext);

  const dispatch = useDispatch();

  const [isMockDatasourceSelected, setIsMockDatasourceSelected] =
    useState(false);

  const pluginsPackageNamesMap = useSelector(getPluginIdPackageNamesMap);

  const pluginImages = useSelector(getPluginImages);

  const datasources: Datasource[] = useSelector(getDatasources);

  const isDatasourceLoading = useSelector(getDatasourceLoading);

  const mockDatasources: MockDatasource[] = useSelector(getMockDatasources);

  const widget = useSelector((state: AppState) => getWidget(state, widgetId));

  const plugins = useSelector(getPlugins);

  const workspaceId = useSelector(getCurrentWorkspaceId);

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
            isValid: isEnvironmentValid(datasource),
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

              const plugin = plugins.find((d) => d.id === datasource.pluginId);

              updateConfig({
                datasource: valueOption?.id,
                datasourcePluginType: plugin?.type,
                datasourcePluginName: plugin?.name,
              });

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

              AnalyticsUtil.logEvent("GENERATE_QUERY_FOR_WIDGET", {
                widgetName: widget.widgetName,
                widgetType: widget.type,
                propertyName: propertyName,
                pluginType: plugin?.type,
                pluginName: plugin?.name,
                isSampleDb: datasource.isMock,
              });
            }
          },
        })),
      );
    }

    let mockDatasourceOptions: DropdownOptionType[] = [];

    if (mockDatasources.length) {
      mockDatasourceOptions = mockDatasourceOptions.concat(
        mockDatasources
          .filter(({ packageName }) => {
            if (!WidgetQueryGeneratorRegistry.has(packageName)) {
              return false;
            }

            /*
             * remove mocks from which the user has already created the source.
             */
            const datasource: Datasource | undefined =
              availableDatasources.find(
                (d) =>
                  pluginsPackageNamesMap[d.pluginId] === packageName &&
                  d.isMock,
              );

            return !datasource;
          })
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
              const plugin = plugins.find(
                (d) =>
                  d.id ===
                  invert(pluginsPackageNamesMap)[
                    datasource.packageName as string
                  ],
              );

              updateConfig({
                datasource: valueOption?.id,
                datasourcePluginType: plugin?.type,
                datasourcePluginName: plugin?.name,
              });

              setIsMockDatasourceSelected(true);

              if (valueOption?.id) {
                dispatch(addAndFetchMockDatasourceStructure(datasource));
              }

              AnalyticsUtil.logEvent("GENERATE_QUERY_FOR_WIDGET", {
                widgetName: widget.widgetName,
                widgetType: widget.type,
                propertyName: propertyName,
                pluginType: plugin?.type,
                pluginName: plugin?.name,
                fromMock: true,
              });

              AnalyticsUtil.logEvent("ADD_MOCK_DATASOURCE_CLICK", {
                datasourceName: datasource.name,
                workspaceId,
                packageName: plugin?.packageName,
                pluginName: plugin?.name,
                from: DatasourceCreateEntryPoints.ONE_CLICK_BINDING,
              });
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
        icon: <Icon name="plus" size="md" />,
        id: "Connect new datasource",
        label: "Connect new datasource",
        value: "Connect new datasource",
        onSelect: () => {
          history.push(
            integrationEditorURL({
              pageId: currentPageId,
              selectedTab: INTEGRATION_TABS.NEW,
            }),
          );

          AnalyticsUtil.logEvent("BIND_OTHER_ACTIONS", {
            widgetName: widget.widgetName,
            widgetType: widget.type,
            propertyName: propertyName,
            selectedAction: "Connect new datasource",
          });

          const entryPoint = DatasourceCreateEntryPoints.ONE_CLICK_BINDING;

          AnalyticsUtil.logEvent("NAVIGATE_TO_CREATE_NEW_DATASOURCE_PAGE", {
            entryPoint,
          });
        },
      },
      {
        id: "Insert binding",
        label: "Insert binding",
        value: "Insert binding",
        icon: <Binding>{"{ }"}</Binding>,
        onSelect: () => {
          addBinding("{{}}", true);

          AnalyticsUtil.logEvent("BIND_OTHER_ACTIONS", {
            widgetName: widget.widgetName,
            widgetType: widget.type,
            propertyName: propertyName,
            selectedAction: "Binding",
          });
        },
      },
    ];
  }, [currentPageId, history, addBinding, addSnippet, propertyName]);

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

        updateConfig({
          datasource: "",
          datasourcePluginType: "",
          datasourcePluginName: "",
        });

        AnalyticsUtil.logEvent("BIND_EXISTING_QUERY_TO_WIDGET", {
          widgetName: widget.widgetName,
          widgetType: widget.type,
          propertyName: propertyName,
          queryName: query.config.name,
          pluginType: query.config.pluginType,
        });
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
      isMockDatasourceSelected &&
      !isDatasourceLoading &&
      actualDatasourceOptions.length
    ) {
      setIsMockDatasourceSelected(false);
      updateConfig(
        "datasource",
        actualDatasourceOptions[actualDatasourceOptions.length - 1].id,
      );
    }
  }, [isMockDatasourceSelected, isDatasourceLoading, datasourceOptions]);

  const isConnecting = useSelector(
    getisOneClickBindingConnectingForWidget(widgetId),
  );

  useEffect(() => {
    if (isSourceOpen) {
      AnalyticsUtil.logEvent("WIDGET_CONNECT_DATA_CLICK", {
        widgetName: widget.widgetName,
        widgetType: widget.type,
      });
    }
  }, [isSourceOpen]);

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
