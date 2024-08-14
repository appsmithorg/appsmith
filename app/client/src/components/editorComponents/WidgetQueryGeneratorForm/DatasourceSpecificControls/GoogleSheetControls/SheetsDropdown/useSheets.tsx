import React, { useCallback, useContext, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Bold,
  Label,
} from "components/editorComponents/WidgetQueryGeneratorForm/styles";
import { WidgetQueryGeneratorFormContext } from "components/editorComponents/WidgetQueryGeneratorForm";
import { fetchGheetColumns } from "actions/datasourceActions";
import {
  getGsheetsSheets,
  getisFetchingGsheetsSheets,
} from "selectors/datasourceSelectors";
import { getDatasource } from "ee/selectors/entitiesSelector";
import type { AppState } from "ee/reducers";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { getWidget } from "sagas/selectors";

export function useSheets() {
  const dispatch = useDispatch();

  const { config, propertyName, updateConfig, widgetId } = useContext(
    WidgetQueryGeneratorFormContext,
  );

  const widget = useSelector((state: AppState) => getWidget(state, widgetId));

  const selectedDatasource = useSelector((state: AppState) =>
    getDatasource(state, config.datasource),
  );

  const sheets = useSelector(getGsheetsSheets(config.table));

  const options = useMemo(() => {
    return (sheets?.value || []).map(({ label, value }) => ({
      id: value,
      label: label,
      value: value,
      data: {
        sheetURL: config.table,
      },
    }));
  }, [sheets, config]);

  const isLoading = useSelector(getisFetchingGsheetsSheets);

  const onSelect = useCallback(
    (sheet, sheetObj) => {
      updateConfig("sheet", sheetObj.value);

      if (selectedDatasource) {
        dispatch(
          fetchGheetColumns({
            datasourceId: selectedDatasource?.id,
            pluginId: selectedDatasource.pluginId,
            sheetName: sheetObj.label,
            sheetUrl: sheetObj.data.sheetURL || "",
            headerIndex: config.tableHeaderIndex,
          }),
        );
      }

      AnalyticsUtil.logEvent("GENERATE_QUERY_SELECT_SHEET_GSHEET", {
        widgetName: widget.widgetName,
        widgetType: widget.type,
        propertyName: propertyName,
        dataTableName: config.table,
        sheetName: sheetObj.value,
        pluginType: config.datasourcePluginType,
        pluginName: config.datasourcePluginName,
        connectionMode: config.datasourceConnectionMode,
      });
    },
    [config, updateConfig, dispatch, widget, selectedDatasource, propertyName],
  );

  return {
    error: sheets?.error,
    options,
    isLoading,
    labelText: "Select sheet from " + config.table,
    label: (
      <Label>
        Select sheet from <Bold>{config.table}</Bold>
      </Label>
    ),
    onSelect,
    selected: options.find((option) => config.sheet === option.value),
    show: !!config.table,
  };
}
