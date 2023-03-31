import React from "react";
import { fetchGheetSheets } from "actions/datasourceActions";
import type { AppState } from "ce/reducers";
import { Colors } from "constants/Colors";
import type { DropdownOption } from "design-system-old";
import { IconSize } from "design-system-old";
import { PluginPackageName } from "entities/Action";
import { PluginFormInputFieldMap } from "pages/Editor/GeneratePage/components/constants";
import { useCallback, useContext, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getDatasourcesStructure,
  getIsFetchingDatasourceStructure,
} from "selectors/entitiesSelector";
import { QueryGeneratorFormContext } from "../..";
import { Bold } from "../../styles";
import type { DatasourceTableDropdownOption } from "../../types";

export function useTableOrSpreadsheet() {
  const dispatch = useDispatch();

  const { config, updateConfig } = useContext(QueryGeneratorFormContext);

  const DatasourceStructure = useSelector(getDatasourcesStructure);

  const spreadSheets = useSelector((state: AppState) => {
    if (config.datasource.id) {
      return state.entities.datasources.gsheetStructure.spreadsheets[
        config.datasource.id
      ];
    } else {
      return [];
    }
  });
  const isFetchingSpreadsheets = useSelector(
    (state: AppState) =>
      state.entities.datasources.gsheetStructure.isFetchingSpreadsheets,
  );

  const ifFetchingDatasourceStructure = useSelector(
    getIsFetchingDatasourceStructure,
  );

  const selectedDatasourcePluginPackageName =
    config.datasource.data.packageName;

  const pluginField: {
    TABLE: string;
    COLUMN: string;
  } =
    selectedDatasourcePluginPackageName &&
    PluginFormInputFieldMap[selectedDatasourcePluginPackageName]
      ? PluginFormInputFieldMap[selectedDatasourcePluginPackageName]
      : PluginFormInputFieldMap.DEFAULT;

  const options: DropdownOption[] = useMemo(() => {
    let options: DropdownOption[] = [];

    if (
      selectedDatasourcePluginPackageName === PluginPackageName.GOOGLE_SHEETS
    ) {
      options = spreadSheets;
    } else if (config.datasource.id) {
      const selectedDatasourceStructure =
        DatasourceStructure[config.datasource.id];

      options = (selectedDatasourceStructure?.tables as DropdownOption[]) || [];
    }

    return options.map(({ name }) => ({
      id: name,
      label: name,
      value: name,
      icon: "tables",
      iconSize: IconSize.LARGE,
      iconColor: Colors.BURNING_ORANGE,
    }));
  }, []);

  const onSelect = useCallback(
    (table: string | undefined, TableObj: DatasourceTableDropdownOption) => {
      if (table && TableObj) {
        updateConfig("table", TableObj);

        if (
          selectedDatasourcePluginPackageName ===
            PluginPackageName.GOOGLE_SHEETS &&
          config.datasource.id
        ) {
          dispatch(
            fetchGheetSheets({
              datasourceId: config.datasource.id,
              pluginId: config.datasource.data.pluginId,
            }),
          );
        }
      }
    },
    [],
  );

  return {
    label: `Select ${pluginField.TABLE} from ${(
      <Bold>{config.datasource.label}</Bold>
    )}`,
    options,
    isLoading: isFetchingSpreadsheets || ifFetchingDatasourceStructure,
    onSelect,
    selected: config.datasource,
  };
}
