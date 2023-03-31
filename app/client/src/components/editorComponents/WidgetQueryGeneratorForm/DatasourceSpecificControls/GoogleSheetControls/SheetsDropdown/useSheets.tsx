import React, { useCallback, useContext } from "react";
import type { AppState } from "ce/reducers";
import { useSelector } from "react-redux";
import { Bold } from "components/editorComponents/WidgetQueryGeneratorForm/styles";
import { QueryGeneratorFormContext } from "components/editorComponents/WidgetQueryGeneratorForm";

export function useSheets() {
  const { config, updateConfig } = useContext(QueryGeneratorFormContext);

  const options = useSelector((state: AppState) => {
    if (config.table.id) {
      return state.entities.datasources.gsheetStructure.sheets[config.table.id];
    } else {
      return [];
    }
  });

  const isLoading = useSelector(
    (state: AppState) =>
      state.entities.datasources.gsheetStructure.isFetchingSheets,
  );

  const onSelect = useCallback(
    (value) => {
      updateConfig("sheet", value);
    },
    [config, updateConfig],
  );

  return {
    options,
    isLoading,
    label: `Select sheet from ${(<Bold>{config.table.label}</Bold>)}`,
    onSelect,
    selected: config.sheet,
  };
}
