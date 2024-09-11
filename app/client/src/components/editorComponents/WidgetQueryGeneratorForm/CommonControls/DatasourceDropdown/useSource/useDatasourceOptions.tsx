import React, { useContext, useEffect, useMemo, useState } from "react";
import WidgetQueryGeneratorRegistry from "utils/WidgetQueryGeneratorRegistry";
import type { DropdownOptionType } from "../../../types";
import {
  getEnvironmentConfiguration,
  isEnvironmentValid,
} from "ee/utils/Environments";
import { getCurrentEnvironmentId } from "ee/selectors/environmentSelectors";
import { DatasourceImage, ImageWrapper } from "../../../styles";
import {
  type Datasource,
  DatasourceConnectionMode,
  type MockDatasource,
} from "entities/Datasource";
import { PluginPackageName } from "entities/Action";
import {
  addAndFetchMockDatasourceStructure,
  fetchDatasourceStructure,
  fetchGheetSpreadsheets,
} from "actions/datasourceActions";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { invert } from "lodash";
import { DatasourceCreateEntryPoints } from "constants/Datasource";
import { useDispatch, useSelector } from "react-redux";
import {
  getDatasourceLoading,
  getDatasources,
  getMockDatasources,
  getPluginIdPackageNamesMap,
  getPlugins,
} from "ee/selectors/entitiesSelector";
import { getCurrentWorkspaceId } from "ee/selectors/selectedWorkspaceSelectors";
import type { WidgetProps } from "widgets/BaseWidget";
import { WidgetQueryGeneratorFormContext } from "components/editorComponents/WidgetQueryGeneratorForm/index";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { getDatasourceConnectionMode } from "components/editorComponents/WidgetQueryGeneratorForm/utils";

interface DatasourceOptionsProps {
  widget: WidgetProps;
  pluginImages: Record<string, string>;
}

function useDatasourceOptions(props: DatasourceOptionsProps) {
  const { config, propertyName, updateConfig } = useContext(
    WidgetQueryGeneratorFormContext,
  );
  const { pluginImages, widget } = props;
  const dispatch = useDispatch();
  const datasources: Datasource[] = useSelector(getDatasources);
  const pluginsPackageNamesMap = useSelector(getPluginIdPackageNamesMap);
  const mockDatasources: MockDatasource[] = useSelector(getMockDatasources);
  const workspaceId = useSelector(getCurrentWorkspaceId);
  const currentEnvironment: string = useSelector(getCurrentEnvironmentId);
  const plugins = useSelector(getPlugins);
  const isDatasourceLoading = useSelector(getDatasourceLoading);

  const [isMockDatasourceSelected, setIsMockDatasourceSelected] =
    useState(false);

  const [actualDatasourceOptions, mockDatasourceOptions] = useMemo(() => {
    const availableDatasources = datasources.filter(({ pluginId }) =>
      WidgetQueryGeneratorRegistry.has(pluginsPackageNamesMap[pluginId]),
    );
    let filteredDatasources = availableDatasources;

    /* Exclude Gsheets from datasource options till this gets resolved https://github.com/appsmithorg/appsmith/issues/27102*/
    if (widget.type === "JSON_FORM_WIDGET") {
      filteredDatasources = availableDatasources.filter((datasource) => {
        return (
          pluginsPackageNamesMap[datasource.pluginId] !==
          PluginPackageName.GOOGLE_SHEETS
        );
      });
    }
    let datasourceOptions: DropdownOptionType[] = [];
    if (filteredDatasources.length) {
      datasourceOptions = datasourceOptions.concat(
        filteredDatasources.map((datasource) => ({
          id: datasource.id,
          label: datasource.name,
          value: datasource.name,
          data: {
            pluginId: datasource.pluginId,
            isValid: isEnvironmentValid(datasource, currentEnvironment),
            pluginPackageName: pluginsPackageNamesMap[datasource.pluginId],
            isSample: false,
            connectionMode: getDatasourceConnectionMode(
              pluginsPackageNamesMap[datasource.pluginId],
              getEnvironmentConfiguration(datasource, currentEnvironment),
            ),
          },
          icon: (
            <ImageWrapper>
              <DatasourceImage
                alt=""
                className="dataSourceImage"
                src={getAssetUrl(pluginImages[datasource.pluginId])}
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
                datasourceConnectionMode:
                  valueOption?.data.connectionMode ||
                  DatasourceConnectionMode.READ_ONLY,
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
                connectionMode: valueOption?.data.connectionMode,
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
            const datasource: Datasource | undefined = filteredDatasources.find(
              (d) =>
                pluginsPackageNamesMap[d.pluginId] === packageName && d.isMock,
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
                  src={getAssetUrl(
                    pluginImages[
                      invert(pluginsPackageNamesMap)[
                        datasource.packageName as string
                      ]
                    ],
                  )}
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
                datasourceConnectionMode: DatasourceConnectionMode.READ_WRITE,
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
      const datasource =
        actualDatasourceOptions[actualDatasourceOptions.length - 1];

      const plugin = plugins.find((d) => d.id === datasource.data.pluginId);

      setIsMockDatasourceSelected(false);

      updateConfig({
        datasource: datasource.id,
        datasourceConnectionMode: datasource.data.connectionMode,
        datasourcePluginType: plugin?.type,
        datasourcePluginName: plugin?.name,
      });
    }
  }, [isMockDatasourceSelected, isDatasourceLoading, datasourceOptions]);

  return { actualDatasourceOptions, mockDatasourceOptions, datasourceOptions };
}

export default useDatasourceOptions;
