package com.external.utils;

import com.appsmith.external.models.DatasourceStructure;
import io.r2dbc.spi.Row;
import io.r2dbc.spi.RowMetadata;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class MySqlGetStructureUtils {

    private static final String DATE_COLUMN_TYPE_NAME = "date";
    private static final String DATETIME_COLUMN_TYPE_NAME = "datetime";
    private static final String TIMESTAMP_COLUMN_TYPE_NAME = "timestamp";

    /**
     * 1. Parse results obtained by running COLUMNS_QUERY defined on top of the page.
     * 2. A sample mysql output for the query is also given near COLUMNS_QUERY definition on top of the page.
     */
    public static void getTableInfo(Row row, RowMetadata meta, Map<String, DatasourceStructure.Table> tablesByName) {
        final String tableName = row.get("table_name", String.class);

        if (!tablesByName.containsKey(tableName)) {
            tablesByName.put(
                    tableName,
                    new DatasourceStructure.Table(
                            DatasourceStructure.TableType.TABLE,
                            null,
                            tableName,
                            new ArrayList<>(),
                            new ArrayList<>(),
                            new ArrayList<>()));
        }

        final DatasourceStructure.Table table = tablesByName.get(tableName);
        table.getColumns()
                .add(new DatasourceStructure.Column(
                        row.get("column_name", String.class),
                        row.get("column_type", String.class),
                        null,
                        row.get("extra", String.class).contains("auto_increment")));

        return;
    }

    /**
     * 1. Parse results obtained by running KEYS_QUERY defined on top of the page.
     * 2. A sample mysql output for the query is also given near KEYS_QUERY definition on top of the page.
     */
    public static void getKeyInfo(
            Row row,
            RowMetadata meta,
            Map<String, DatasourceStructure.Table> tablesByName,
            Map<String, DatasourceStructure.Key> keyRegistry) {
        final String constraintName = row.get("constraint_name", String.class);
        final char constraintType = row.get("constraint_type", String.class).charAt(0);
        final String selfSchema = row.get("self_schema", String.class);
        final String tableName = row.get("self_table", String.class);

        if (!tablesByName.containsKey(tableName)) {
            /* do nothing */
            return;
        }

        final DatasourceStructure.Table table = tablesByName.get(tableName);
        final String keyFullName = tableName + "." + row.get("constraint_name", String.class);

        if (constraintType == 'p') {
            if (!keyRegistry.containsKey(keyFullName)) {
                final DatasourceStructure.PrimaryKey key =
                        new DatasourceStructure.PrimaryKey(constraintName, new ArrayList<>());
                keyRegistry.put(keyFullName, key);
                table.getKeys().add(key);
            }
            ((DatasourceStructure.PrimaryKey) keyRegistry.get(keyFullName))
                    .getColumnNames()
                    .add(row.get("self_column", String.class));
        } else if (constraintType == 'f') {
            final String foreignSchema = row.get("foreign_schema", String.class);
            final String prefix = (foreignSchema.equalsIgnoreCase(selfSchema) ? "" : foreignSchema + ".")
                    + row.get("foreign_table", String.class) + ".";

            if (!keyRegistry.containsKey(keyFullName)) {
                final DatasourceStructure.ForeignKey key =
                        new DatasourceStructure.ForeignKey(constraintName, new ArrayList<>(), new ArrayList<>());
                keyRegistry.put(keyFullName, key);
                table.getKeys().add(key);
            }

            ((DatasourceStructure.ForeignKey) keyRegistry.get(keyFullName))
                    .getFromColumns()
                    .add(row.get("self_column", String.class));
            ((DatasourceStructure.ForeignKey) keyRegistry.get(keyFullName))
                    .getToColumns()
                    .add(prefix + row.get("foreign_column", String.class));
        }

        return;
    }

    /**
     * 1. Generate template for all tables in the database.
     */
    public static void getTemplates(Map<String, DatasourceStructure.Table> tablesByName) {
        for (DatasourceStructure.Table table : tablesByName.values()) {
            final List<DatasourceStructure.Column> columnsWithoutDefault = table.getColumns().stream()
                    .filter(column -> column.getDefaultValue() == null)
                    .collect(Collectors.toList());

            final List<String> columnNames = new ArrayList<>();
            final List<String> columnValues = new ArrayList<>();
            final StringBuilder setFragments = new StringBuilder();

            for (DatasourceStructure.Column column : columnsWithoutDefault) {
                final String name = column.getName();
                final String type = column.getType();
                String value;

                if (type == null) {
                    value = "null";
                } else if ("text".equals(type) || "varchar".equals(type)) {
                    value = "''";
                } else if (type.startsWith("int")) {
                    value = "1";
                } else if (type.startsWith("double")) {
                    value = "1.0";
                } else if (DATE_COLUMN_TYPE_NAME.equals(type)) {
                    value = "'2019-07-01'";
                } else if (DATETIME_COLUMN_TYPE_NAME.equals(type) || TIMESTAMP_COLUMN_TYPE_NAME.equals(type)) {
                    value = "'2019-07-01 10:00:00'";
                } else {
                    value = "''";
                }

                columnNames.add(name);
                columnValues.add(value);
                setFragments
                        .append("\n    ")
                        .append(name)
                        .append(" = ")
                        .append(value)
                        .append(",");
            }

            // Delete the last comma
            if (setFragments.length() > 0) {
                setFragments.deleteCharAt(setFragments.length() - 1);
            }

            final String tableName = table.getName();
            table.getTemplates()
                    .addAll(List.of(
                            new DatasourceStructure.Template(
                                    "SELECT", "SELECT * FROM " + tableName + " LIMIT 10;", true),
                            new DatasourceStructure.Template(
                                    "INSERT",
                                    "INSERT INTO " + tableName
                                            + " (" + String.join(", ", columnNames) + ")\n"
                                            + "  VALUES (" + String.join(", ", columnValues) + ");",
                                    false),
                            new DatasourceStructure.Template(
                                    "UPDATE",
                                    "UPDATE " + tableName + " SET"
                                            + setFragments + "\n"
                                            + "  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may update every row in the table!",
                                    false),
                            new DatasourceStructure.Template(
                                    "DELETE",
                                    "DELETE FROM " + tableName
                                            + "\n  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may delete everything in the table!",
                                    false)));
        }
    }
}
