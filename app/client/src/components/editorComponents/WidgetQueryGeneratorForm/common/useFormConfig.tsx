import { useContext } from "react";
import { WidgetQueryGeneratorFormContext } from "..";
import { useColumns } from "../WidgetSpecificControls/ColumnDropdown/useColumns";

export function useFormConfig() {
  const { aliases, config, otherFields, widgetId } = useContext(
    WidgetQueryGeneratorFormContext,
  );

  const { columns, primaryColumn } = useColumns("", false);

  const dataIdentifierField = otherFields?.find(
    (field) => field.isDataIdentifier && field?.isVisible?.(config),
  );
  const getPrimaryKey = () => {
    if (dataIdentifierField) {
      return config.otherFields?.[dataIdentifierField?.name];
    } else {
      return primaryColumn;
    }
  };

  const searchableColumn = (() => {
    if (config.searchableColumn) {
      return config.searchableColumn;
    } else {
      const alias = aliases?.find((d) => d.isSearcheable)?.name;

      return alias && config.alias[alias];
    }
  })();

  return {
    tableName: config.table,
    sheetName: config.sheet,
    datasourceId: config.datasource,
    widgetId: widgetId,
    tableHeaderIndex: config.tableHeaderIndex,
    searchableColumn,
    columns: columns.filter((column) => column.isSelected),
    primaryColumn: getPrimaryKey(),
    connectionMode: config.datasourceConnectionMode,
    aliases: Object.entries(config.alias).map(([key, value]) => ({
      name: key,
      alias: value,
    })),
    otherFields: config.otherFields,
  };
}
