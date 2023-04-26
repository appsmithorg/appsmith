import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { AppState } from "ce/reducers";
import { PluginPackageName } from "entities/Action";
import { isNumber } from "lodash";
import { useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getPluginPackageFromDatasourceId } from "selectors/entitiesSelector";
import { getisOneClickBindingConnectingForWidget } from "selectors/oneClickBindingSelectors";
import { WIDGET_QUERY_GENERATION_FORM_CONFIG_VERSION } from "WidgetQueryGenerators/constants";
import { WidgetQueryGeneratorFormContext } from "..";
import { useColumns } from "../WidgetSpecificControls/ColumnDropdown/useColumns";

export function useConnectData() {
  const dispatch = useDispatch();

  const { config, widgetId } = useContext(WidgetQueryGeneratorFormContext);

  const { options: columns, primaryColumn } = useColumns("");

  const isLoading = useSelector(
    getisOneClickBindingConnectingForWidget(widgetId),
  );

  const onClick = () => {
    const payload = {
      tableName: config.table,
      datasourceId: config.datasource,
      widgetId: widgetId,
      searchableColumn: config.searchableColumn,
      version: WIDGET_QUERY_GENERATION_FORM_CONFIG_VERSION,
      columns: columns.map((column) => column.value),
      primaryColumn,
    };

    dispatch({
      type: ReduxActionTypes.BIND_WIDGET_TO_DATASOURCE,
      payload,
    });
  };

  const selectedDatasourcePluginPackageName = useSelector((state: AppState) =>
    getPluginPackageFromDatasourceId(state, config.datasource),
  );

  const show =
    !!config.datasource &&
    !!config.table &&
    (selectedDatasourcePluginPackageName !== PluginPackageName.GOOGLE_SHEETS ||
      !!config.sheet);

  const disabled =
    selectedDatasourcePluginPackageName === PluginPackageName.GOOGLE_SHEETS &&
    (!config.tableHeaderIndex ||
      !isNumber(Number(config.tableHeaderIndex)) ||
      isNaN(Number(config.tableHeaderIndex)));

  return {
    show,
    disabled,
    onClick,
    isLoading,
  };
}
