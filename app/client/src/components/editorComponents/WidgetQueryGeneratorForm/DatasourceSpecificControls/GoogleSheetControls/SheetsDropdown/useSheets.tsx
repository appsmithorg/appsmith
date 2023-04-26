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
import { getDatasource } from "selectors/entitiesSelector";
import type { AppState } from "ce/reducers";

export function useSheets() {
  const dispatch = useDispatch();

  const { config, updateConfig } = useContext(WidgetQueryGeneratorFormContext);

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
    },
    [config, updateConfig, dispatch],
  );

  return {
    error: sheets?.error,
    options,
    isLoading,
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
