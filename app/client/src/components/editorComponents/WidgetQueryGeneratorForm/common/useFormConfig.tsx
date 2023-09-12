import { useContext, useMemo } from "react";
import { WidgetQueryGeneratorFormContext } from "..";
import { useColumns } from "../WidgetSpecificControls/ColumnDropdown/useColumns";

export function useFormConfig() {
  const { alertMessage, aliases, config, otherFields, widgetId } = useContext(
    WidgetQueryGeneratorFormContext,
  );

  const { columns, primaryColumn } = useColumns("", false);

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
    if (!config.selectedColumns || !config.selectedColumns?.length) {
      return columns?.filter((column) => column.isSelected);
    } else {
      return columns?.filter((column) => {
        return config.selectedColumns?.includes(column.name);
      });
    }
  }, [config.selectedColumns, columns]);

  return {
    tableName: config.table,
    sheetName: config.sheet,
    datasourceId: config.datasource,
    widgetId: widgetId,
    tableHeaderIndex: config.tableHeaderIndex,
    searchableColumn,
    columns: selectedColumns,
    primaryColumn,
    dataIdentifier:
      dataIdentifierField && config.otherFields?.[dataIdentifierField?.name],
    connectionMode: config.datasourceConnectionMode,
    aliases: Object.entries(config.alias).map(([key, value]) => ({
      name: key,
      alias: value,
    })),
    otherFields: config.otherFields,
    alertMessage,
  };
}
