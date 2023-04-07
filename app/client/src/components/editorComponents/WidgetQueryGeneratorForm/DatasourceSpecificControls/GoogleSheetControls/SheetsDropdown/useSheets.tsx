import React, { useCallback, useContext, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Bold,
  Label,
} from "components/editorComponents/WidgetQueryGeneratorForm/styles";
import { WidgetQueryGeneratorFormContext } from "components/editorComponents/WidgetQueryGeneratorForm";
import { DEFAULT_DROPDOWN_OPTION } from "components/editorComponents/WidgetQueryGeneratorForm/constants";
import { fetchGheetColumns } from "actions/datasourceActions";
import {
  getGsheetsSheets,
  getisFetchingGsheetsSheets,
} from "selectors/datasourceSelectors";

export function useSheets() {
  const dispatch = useDispatch();

  const { config, updateConfig } = useContext(WidgetQueryGeneratorFormContext);

  const sheets = useSelector(getGsheetsSheets(config.table.id));

  const options = useMemo(() => {
    return (sheets?.value || []).map(({ label, value }) => ({
      id: value,
      label: label,
      value: value,
      data: {
        sheetURL: config.table.value,
      },
    }));
  }, [sheets, config]);

  const isLoading = useSelector(getisFetchingGsheetsSheets);

  const onSelect = useCallback(
    (sheet, sheetObj) => {
      updateConfig("sheet", sheetObj);

      if (config.datasource.id) {
        dispatch(
          fetchGheetColumns({
            datasourceId: config.datasource.id,
            pluginId: config.datasource.data.pluginId,
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
        Select sheet from <Bold>{config.table.label}</Bold>
      </Label>
    ),
    onSelect,
    selected: config.sheet,
    show: config.table.id !== DEFAULT_DROPDOWN_OPTION.id,
  };
}
