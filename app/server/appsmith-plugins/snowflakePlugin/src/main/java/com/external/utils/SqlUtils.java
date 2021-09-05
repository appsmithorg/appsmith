package com.external.utils;

import com.appsmith.external.models.DatasourceStructure;
import org.springframework.util.StringUtils;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * API reference: https://docs.snowflake.com/en/sql-reference/info-schema/columns.html
 */
public class SqlUtils {

    /**
     * Example output for COLUMNS_QUERY:
     * +--------------+------------+-----------+-------------+-------------+-------------+----------------+-------------+
     * | TABLE_SCHEMA | TABLE_NAME | COLUMN_ID | COLUMN_NAME | COLUMN_TYPE | IS_NULLABLE | COLUMN_DEFAULT | IS_IDENTITY |
     * +--------------+------------+-----------+-------------+-------------+-------------+----------------+-------------+
     * | test_schema  | test       |         1 | id          | int         |           0 |                |        YES  |
     * | test_schema  | test       |         2 | firstname   | varchar     |           1 | Foo            |         NO  |
     * | test_schema  | test       |         3 | middlename  | varchar     |           1 |                |         NO  |
     * | test_schema  | test       |         4 | lastname    | varchar     |           1 |                |         NO  |
     * +--------------+------------+-----------+-------------+-------------+-------------+----------------+-------------+
     */
    public static final String COLUMNS_QUERY =
            "SELECT " +
                    "cols.table_schema as table_schema, " +
                    "cols.table_name as table_name, " +
                    "cols.ordinal_position as column_id, " +
                    "cols.column_name as column_name, " +
                    "cols.data_type as column_type, " +
                    "cols.is_nullable = 'YES' as is_nullable, " +
                    "cols.column_default as column_default, " +
                    "cols.is_identity as is_identity " +
                    "FROM " +
                    "information_schema.columns cols " +
                    "WHERE " +
                    "cols.table_schema = ";

    /**
     * Example output for PRIMARY_KEYS_QUERY:
     * +------------+---------------+-------------+------------+-------------+--------------+--------------------+---------+
     * | created_on | database_name | schema_name | table_name | column_name | key_sequence | constraint_name    | comment |
     * +------------+---------------+-------------+------------+-------------+--------------+--------------------+---------+
     * | test       | test_db       | test_schema | test       | id          |            1 | SYS_CONSTRAINT_hex |         |
     * +------------+---------------+-------------+------------+-------------+--------------+--------------------+---------+
     */
    public static final String PRIMARY_KEYS_QUERY = "SHOW PRIMARY KEYS";

    /**
     * Example output for FOREIGN_KEYS_QUERY:
     * +------------+------------------+----------------+---------------+----------------+------------------+----------------+---------------+----------------+--------------+----------------+-------------+--------------------+--------------------+-----------------+------------+
     * | created_on | pk_database_name | pk_schema_name | pk_table_name | pk_column_name | fk_database_name | fk_schema_name | fk_table_name | pk_column_name | key_sequence | update_rule    | delete_rule | fk_name            | pk_name            | deferrability   | comment    |
     * +------------+------------------+----------------+---------------+----------------+------------------+----------------+---------------+----------------+--------------+----------------+-------------+--------------------+--------------------+-----------------+------------+
     * | test       | test_db          | test_schema    | test          | id             | test_db          | test_schema    | test2         | f_id           |            1 | NO ACTION      | NO ACTION   | SYS_CONSTRAINT_hex | SYS_CONSTRAINT_hex |                 |            |
     * +------------+------------------+----------------+---------------+----------------+------------------+----------------+---------------+----------------+--------------+----------------+-------------+--------------------+--------------------+-----------------+------------+
     */
    public static final String FOREIGN_KEYS_QUERY = "SHOW IMPORTED KEYS";

    public static String getDefaultValueByDataType(String datatype) {
        if (datatype == null) {
            return "null";
        }
        datatype = datatype.toUpperCase();
        switch (datatype) {
            case "NUMBER":
            case "DECIMAL":
            case "NUMERIC":
            case "INTEGER":
            case "INT":
            case "BIGINT":
            case "SMALLINT":
                return "1";
            case "FLOAT":
            case "FLOAT4":
            case "FLOAT8":
            case "DOUBLE":
            case "DOUBLE PRECISION":
            case "REAL":
                return "1.0";
            case "BINARY":
            case "VARBINARY":
                return "to_binary('AB')";
            case "BOOLEAN":
                return "true";
            case "DATE":
                return "'2021-01-01'";
            case "TIME":
                return "'00:00:01'";
            case "DATETIME":
            case "TIMESTAMP":
            case "TIMESTAMP_LTZ":
            case "TIMESTAMP_NTZ":
            case "TIMESTAMP_TZ":
                return "'2021-01-01 00:00:01'";
            case "ARRAY":
                return "array_construct(1, 2, 3)";
            case "VARIANT":
                return
                        "parse_json(' { \"key1\": \"value1\", \"key2\": \"value2\" } ')";
            case "OBJECT":
                return
                        "parse_json(' { \"outer_key1\": { \"inner_key1A\": \"1a\", \"inner_key1B\": NULL }, '\n" +
                                "              ||\n" +
                                "               '   \"outer_key2\": { \"inner_key2\": 2 } '\n" +
                                "              ||\n" +
                                "               ' } ')";
            case "GEOGRAPHY":
                return "'POINT(-122.35 37.55)'";
            case "VARCHAR":
            case "CHAR":
            case "CHARACTER":
            case "STRING":
            case "TEXT":
            default:
                return "''";
        }
    }

    /**
     * 1. Generate template for all tables in the database.
     */
    public static void getTemplates(Map<String, DatasourceStructure.Table> tablesByName) {
        for (DatasourceStructure.Table table : tablesByName.values()) {
            final List<DatasourceStructure.Column> columnsWithoutDefault = table.getColumns()
                    .stream()
                    .filter(column -> column.getDefaultValue() == null)
                    .collect(Collectors.toList());

            final List<String> columnNames = new ArrayList<>();
            final List<String> columnValues = new ArrayList<>();
            final StringBuilder setFragments = new StringBuilder();

            for (DatasourceStructure.Column column : columnsWithoutDefault) {
                final String name = column.getName();
                final String type = column.getType();
                String value = getDefaultValueByDataType(type);

                columnNames.add(name);
                columnValues.add(value);
                setFragments.append("\n    ").append(name).append(" = ").append(value).append(",");
            }

            // Delete the last comma
            if (setFragments.length() > 0) {
                setFragments.deleteCharAt(setFragments.length() - 1);
            }

            final String tableName = table.getSchema() + "." + table.getName();
            table.getTemplates().addAll(List.of(
                    new DatasourceStructure.Template("SELECT", "SELECT * FROM " + tableName + " LIMIT 10;"),
                    new DatasourceStructure.Template("INSERT", "INSERT INTO " + tableName
                            + " (" + String.join(", ", columnNames) + ")\n"
                            + "  VALUES (" + String.join(", ", columnValues) + ");"),
                    new DatasourceStructure.Template("UPDATE", "UPDATE " + tableName + " SET"
                            + setFragments.toString() + "\n"
                            + "  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may update every row in the table!"),
                    new DatasourceStructure.Template("DELETE", "DELETE FROM " + tableName
                            + "\n  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may delete everything in the table!")
            ));
        }
    }

    public static void getForeignKeyInfo(ResultSet row, Map<String, DatasourceStructure.Table> tablesByName, Map<String, DatasourceStructure.Key> keyRegistry) throws SQLException {
        final String constraintName = row.getString("fk_name");
        final String selfSchema = row.getString("pk_schema_name");
        final String fkTableName = row.getString("fk_table_name");
        final String tableName = row.getString("pk_table_name");

        if (!tablesByName.containsKey(tableName)) {
            /* do nothing */
            return;
        }

        final DatasourceStructure.Table table = tablesByName.get(tableName);
        final String keyFullName = tableName + "." + constraintName;

        final String foreignSchema = row.getString("fk_schema_name");
        final String prefix = (foreignSchema.equalsIgnoreCase(selfSchema) ? "" : foreignSchema + ".")
                + fkTableName + ".";

        if (!keyRegistry.containsKey(keyFullName)) {
            final DatasourceStructure.ForeignKey key = new DatasourceStructure.ForeignKey(
                    constraintName,
                    new ArrayList<>(),
                    new ArrayList<>()
            );
            keyRegistry.put(keyFullName, key);
            table.getKeys().add(key);
        }

        ((DatasourceStructure.ForeignKey) keyRegistry.get(keyFullName)).getFromColumns()
                .add(row.getString("pk_column_name"));
        ((DatasourceStructure.ForeignKey) keyRegistry.get(keyFullName)).getToColumns()
                .add(prefix + row.getString("fk_column_name"));
    }

    public static void getPrimaryKeyInfo(ResultSet row, Map<String, DatasourceStructure.Table> tablesByName, Map<String, DatasourceStructure.Key> keyRegistry) throws SQLException {
        final String constraintName = row.getString("constraint_name");
        final String tableName = row.getString("table_name");

        if (!tablesByName.containsKey(tableName)) {
            /* do nothing */
            return;
        }

        final DatasourceStructure.Table table = tablesByName.get(tableName);
        final String keyFullName = tableName + "." + constraintName;

        if (!keyRegistry.containsKey(keyFullName)) {
            final DatasourceStructure.PrimaryKey key = new DatasourceStructure.PrimaryKey(
                    constraintName,
                    new ArrayList<>()
            );
            keyRegistry.put(keyFullName, key);
            table.getKeys().add(key);
        }
        ((DatasourceStructure.PrimaryKey) keyRegistry.get(keyFullName)).getColumnNames()
                .add(row.getString("column_name"));
    }

    public static void getTableInfo(ResultSet row, Map<String, DatasourceStructure.Table> tablesByName) throws SQLException {
        final String tableSchema = row.getString("TABLE_SCHEMA");
        final String tableName = row.getString("TABLE_NAME");

        if (!tablesByName.containsKey(tableName)) {
            tablesByName.put(tableName, new DatasourceStructure.Table(
                    DatasourceStructure.TableType.TABLE,
                    tableSchema,
                    tableName,
                    new ArrayList<>(),
                    new ArrayList<>(),
                    new ArrayList<>()
            ));
        }
        final DatasourceStructure.Table table = tablesByName.get(tableName);
        String defaultValue = row.getString("COLUMN_DEFAULT");
        // AUTOINCREMENT and IDENTITY are synonymous. If either is specified for a column, Snowflake utilizes a sequence
        // to generate the values for the column. For more information about sequences, see Using Sequences
        boolean isAutogenerated = "YES".equalsIgnoreCase(row.getString("IS_IDENTITY"))
            || (!StringUtils.isEmpty(defaultValue) && defaultValue.toLowerCase().contains("nextval"));

        table.getColumns().add(new DatasourceStructure.Column(
                row.getString("COLUMN_NAME"),
                row.getString("COLUMN_TYPE"),
                defaultValue,
                isAutogenerated
        ));
    }
}
