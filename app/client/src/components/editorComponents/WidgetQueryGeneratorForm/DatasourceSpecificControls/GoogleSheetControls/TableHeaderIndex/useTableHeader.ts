import { fetchGheetColumns } from "actions/datasourceActions";
import { WidgetQueryGeneratorFormContext } from "components/editorComponents/WidgetQueryGeneratorForm";
import { DEFAULT_DROPDOWN_OPTION } from "components/editorComponents/WidgetQueryGeneratorForm/constants";
import { isNumber } from "lodash";
import { useCallback, useContext } from "react";
import { useDispatch } from "react-redux";

export function useTableHeaderIndex() {
  const dispatch = useDispatch();

  const { config, updateConfig } = useContext(WidgetQueryGeneratorFormContext);

  const onChange = useCallback(
    (value) => {
      const parsed = Number(value);

      updateConfig("tableHeaderIndex", value);

      if (
        config.datasource.id &&
        config.sheet.label &&
        config.sheet.data.sheetURL &&
        value &&
        isNumber(parsed) &&
        !isNaN(parsed)
      ) {
        dispatch(
          fetchGheetColumns({
            datasourceId: config.datasource.id,
            pluginId: config.datasource.data.pluginId,
            sheetName: config.sheet.label,
            sheetUrl: config.sheet.data.sheetURL,
            headerIndex: parsed,
          }),
        );
      }
    },
    [config, updateConfig, dispatch],
  );

  return {
    error:
      (!config.tableHeaderIndex ||
        !isNumber(Number(config.tableHeaderIndex)) ||
        isNaN(Number(config.tableHeaderIndex))) &&
      "Please enter a positive number",
    value: config.tableHeaderIndex,
    onChange,
    show: config.table.id !== DEFAULT_DROPDOWN_OPTION.id,
  };
}
