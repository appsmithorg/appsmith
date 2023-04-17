import React from "react";
import { fetchGheetSheets } from "actions/datasourceActions";
import { Colors } from "constants/Colors";
import type { DropdownOption } from "design-system-old";
import { IconSize } from "design-system-old";
import { PluginPackageName } from "entities/Action";
import { useCallback, useContext, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getDatasourceStructureById,
  getIsFetchingDatasourceStructure,
} from "selectors/entitiesSelector";
import { WidgetQueryGeneratorFormContext } from "../..";
import { Bold, Label } from "../../styles";
import type { DatasourceTableDropdownOption } from "../../types";
import {
  DEFAULT_DROPDOWN_OPTION,
  PluginFormInputFieldMap,
} from "../../constants";
import {
  getGsheetSpreadsheets,
  getIsFetchingGsheetSpreadsheets,
} from "selectors/datasourceSelectors";

export function useTableOrSpreadsheet() {
  const dispatch = useDispatch();

  const { config, updateConfig } = useContext(WidgetQueryGeneratorFormContext);

  const datasourceStructure = useSelector(
    getDatasourceStructureById(config.datasource.id),
  );

  const spreadSheets = useSelector(getGsheetSpreadsheets(config.datasource.id));

  const isFetchingSpreadsheets = useSelector(getIsFetchingGsheetSpreadsheets);

  const isFetchingDatasourceStructure = useSelector(
    getIsFetchingDatasourceStructure,
  );

  const selectedDatasourcePluginPackageName =
    config.datasource.data.pluginPackageName;

  const pluginField: {
    TABLE: string;
    COLUMN: string;
  } =
    selectedDatasourcePluginPackageName &&
    (PluginFormInputFieldMap[selectedDatasourcePluginPackageName] ||
      PluginFormInputFieldMap.DEFAULT);

  const options: DropdownOption[] = useMemo(() => {
    if (
      selectedDatasourcePluginPackageName === PluginPackageName.GOOGLE_SHEETS &&
      spreadSheets
    ) {
      return (spreadSheets.value || []).map(({ label, value }) => ({
        id: value,
        label: label,
        value: value,
        icon: "tables",
        iconSize: IconSize.LARGE,
        iconColor: Colors.BURNING_ORANGE,
      }));
    } else if (datasourceStructure) {
      return (datasourceStructure.tables || []).map(({ name }) => ({
        id: name,
        label: name,
        value: name,
        icon: "tables",
        iconSize: IconSize.LARGE,
        iconColor: Colors.BURNING_ORANGE,
      }));
    } else {
      return [];
    }
  }, [selectedDatasourcePluginPackageName, spreadSheets, datasourceStructure]);

  const onSelect = useCallback(
    (table: string | undefined, TableObj: DatasourceTableDropdownOption) => {
      updateConfig("table", TableObj);

      if (
        selectedDatasourcePluginPackageName === PluginPackageName.GOOGLE_SHEETS
      ) {
        dispatch(
          fetchGheetSheets({
            datasourceId: config.datasource.id,
            pluginId: config.datasource.data.pluginId,
            sheetUrl: TableObj.value || "",
          }),
        );
      }
    },
    [updateConfig, selectedDatasourcePluginPackageName, config, dispatch],
  );

  return {
    error:
      selectedDatasourcePluginPackageName === PluginPackageName.GOOGLE_SHEETS
        ? spreadSheets?.error
        : datasourceStructure?.error?.message,
    label: (
      <Label>
        Select {pluginField?.TABLE} from <Bold>{config.datasource.label}</Bold>
      </Label>
    ),
    options,
    isLoading: isFetchingSpreadsheets || isFetchingDatasourceStructure,
    onSelect,
    selected: config.table,
    show: config.datasource !== DEFAULT_DROPDOWN_OPTION,
  };
}
