import { useContext, useMemo } from "react";
import { WidgetQueryGeneratorFormContext } from "..";
import { useColumns } from "../WidgetSpecificControls/ColumnDropdown/useColumns";

export function useFormConfig() {
  const { alertMessage, aliases, config, otherFields, widgetId } = useContext(
    WidgetQueryGeneratorFormContext,
  );

  const { columns, primaryColumn, selectedColumnsNames } = useColumns(
    "",
    false,
  );

  const dataIdentifierField = otherFields?.find(
    (field) => field.isDataIdentifier && field?.isVisible?.(config),
  );

  const searchableColumn = (() => {
    if (config.searchableColumn) {
      return config.searchableColumn;
    } else {
      const alias = aliases?.find((d) => d.isSearcheable)?.name;

      return alias && config.alias[alias];
    }
  })();

  const selectedColumns = useMemo(() => {
    return columns?.filter((column) => {
      return selectedColumnsNames?.includes(column.name);
    });
  }, [selectedColumnsNames, columns]);

  const dataIdentifier =
    dataIdentifierField && config.otherFields?.[dataIdentifierField?.name];

  return {
    tableName: config.table,
    sheetName: config.sheet,
    datasourceId: config.datasource,
    widgetId: widgetId,
    tableHeaderIndex: config.tableHeaderIndex,
    searchableColumn,
    columns: selectedColumns,
    primaryColumn: primaryColumn || dataIdentifier,
    dataIdentifier: dataIdentifier || primaryColumn,
    connectionMode: config.datasourceConnectionMode,
    aliases: Object.entries(config.alias).map(([key, value]) => ({
      name: key,
      alias: value,
    })),
    otherFields: config.otherFields,
    alertMessage,
  };
}
