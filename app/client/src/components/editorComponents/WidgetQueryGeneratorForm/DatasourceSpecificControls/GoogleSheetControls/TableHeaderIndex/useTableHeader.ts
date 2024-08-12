import { fetchGheetColumns } from "actions/datasourceActions";
import type { AppState } from "ee/reducers";
import { WidgetQueryGeneratorFormContext } from "components/editorComponents/WidgetQueryGeneratorForm";
import { isNumber } from "lodash";
import { useCallback, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getDatasource } from "ee/selectors/entitiesSelector";
import { isValidGsheetConfig } from "components/editorComponents/WidgetQueryGeneratorForm/utils";

export function useTableHeaderIndex() {
  const dispatch = useDispatch();

  const { config, updateConfig } = useContext(WidgetQueryGeneratorFormContext);

  const selectedDatasource = useSelector((state: AppState) =>
    getDatasource(state, config.datasource),
  );

  const onChange = useCallback(
    (value) => {
      const parsed = Number(value);

      updateConfig("tableHeaderIndex", value);

      if (
        selectedDatasource &&
        config.datasource &&
        config.sheet &&
        config.table &&
        value &&
        isNumber(parsed) &&
        !isNaN(parsed)
      ) {
        dispatch(
          fetchGheetColumns({
            datasourceId: config.datasource,
            pluginId: selectedDatasource.pluginId,
            sheetName: config.sheet,
            sheetUrl: config.table,
            headerIndex: parsed,
          }),
        );
      }
    },
    [config, updateConfig, dispatch],
  );

  return {
    error: !isValidGsheetConfig(config) && "Please enter a positive number",
    value: config.tableHeaderIndex,
    onChange,
    show: !!config.table && !!config.sheet,
  };
}
