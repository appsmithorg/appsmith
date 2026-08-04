package com.appsmith.server.helpers.ce;

import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceStructure.ForeignKey;
import com.appsmith.external.models.DatasourceStructure.Key;
import com.appsmith.external.models.DatasourceStructure.PrimaryKey;
import com.appsmith.external.models.DatasourceStructure.Table;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Serializes {@link DatasourceStructure} into a compact string for LLM system prompts.
 *
 * <p>SQL plugins: prioritize tables mentioned in the user's natural-language prompt, union with
 * references in the draft query ({@code currentValue}), then add FK-related tables.
 *
 * <p>Other DB plugins: match legacy client behavior in {@code aiSchemaSerializer.ts} (driven by
 * {@code currentValue} heuristics including Mongo-style patterns).
 */
public final class AiDatasourceSchemaSerializerCE {

    /**
     * Plugin package names treated as SQL for prompt-first schema selection. Keep aligned with
     * {@code appsmith-plugins} modules.
     */
    private static final Set<String> SQL_PLUGIN_PACKAGE_NAMES = Set.of(
            "postgres-plugin",
            "mysql-plugin",
            "mssql-plugin",
            "oracle-plugin",
            "redshift-plugin",
            "snowflake-plugin",
            "databricks-plugin");

    private AiDatasourceSchemaSerializerCE() {}

    public static boolean isSqlPluginPackageName(String packageName) {
        return packageName != null && SQL_PLUGIN_PACKAGE_NAMES.contains(packageName);
    }

    /**
     * SQL path: union of names found in {@code userPrompt} and {@code currentQuery}. If the union
     * is empty, all tables are treated as relevant (same as having no selective signal).
     */
    public static String serializeForSqlPlugin(
            DatasourceStructure structure, String userPrompt, String currentQuery, int budget) {
        if (structure == null || CollectionUtils.isEmpty(structure.getTables())) {
            return null;
        }
        List<Table> tables = structure.getTables();
        List<String> allNames = tables.stream().map(Table::getName).toList();

        Set<String> referenced = new HashSet<>();
        referenced.addAll(extractReferencedTableNames(userPrompt, allNames));
        referenced.addAll(extractReferencedTableNames(currentQuery, allNames));

        if (referenced.isEmpty()) {
            referenced.addAll(allNames);
        }

        for (String fkTable : getFkReferencedTableNames(tables, referenced)) {
            referenced.add(fkTable);
        }

        return serializeWithPriority(structure, referenced, budget);
    }

    /** Non-SQL DB plugins: legacy client parity (single relevance string = draft query). */
    public static String serializeLegacy(DatasourceStructure structure, String currentQuery, int budget) {
        if (structure == null || CollectionUtils.isEmpty(structure.getTables())) {
            return null;
        }
        List<Table> tables = structure.getTables();
        List<String> allNames = tables.stream().map(Table::getName).toList();
        Set<String> referenced = extractReferencedTableNames(currentQuery, allNames);
        for (String fkTable : getFkReferencedTableNames(tables, referenced)) {
            referenced.add(fkTable);
        }
        return serializeWithPriority(structure, referenced, budget);
    }

    static Set<String> extractReferencedTableNames(String query, List<String> allTableNames) {
        Set<String> referenced = new HashSet<>();
        if (!StringUtils.hasText(query) || CollectionUtils.isEmpty(allTableNames)) {
            return referenced;
        }
        String queryLower = query.toLowerCase(Locale.ROOT);
        for (String tableName : allTableNames) {
            if (!StringUtils.hasText(tableName)) {
                continue;
            }
            String nameLower = tableName.toLowerCase(Locale.ROOT);
            String escaped = Pattern.quote(nameLower);

            Pattern sqlPattern =
                    Pattern.compile("(?:^|[\\s,.(])" + escaped + "(?:$|[\\s,.);`])", Pattern.CASE_INSENSITIVE);
            if (sqlPattern.matcher(queryLower).find()) {
                referenced.add(tableName);
                continue;
            }

            Pattern mongoMethodPattern = Pattern.compile("db\\." + escaped + "\\s*\\.", Pattern.CASE_INSENSITIVE);
            if (mongoMethodPattern.matcher(queryLower).find()) {
                referenced.add(tableName);
                continue;
            }

            Pattern jsonValuePattern = Pattern.compile("[\"']\\s*" + escaped + "\\s*[\"']", Pattern.CASE_INSENSITIVE);
            if (jsonValuePattern.matcher(queryLower).find()) {
                referenced.add(tableName);
            }
        }
        return referenced;
    }

    static String serializeTable(Table table) {
        Set<String> pkColumns = new HashSet<>();
        Map<String, String> fkMap = new HashMap<>();

        if (!CollectionUtils.isEmpty(table.getKeys())) {
            List<Key> sortedKeys = new ArrayList<>(table.getKeys());
            sortedKeys.sort(Comparator.naturalOrder());
            for (Key key : sortedKeys) {
                if (key instanceof PrimaryKey pk) {
                    if (!CollectionUtils.isEmpty(pk.getColumnNames())) {
                        pkColumns.addAll(pk.getColumnNames());
                    }
                } else if (key instanceof ForeignKey fk) {
                    List<String> fromCols = fk.getFromColumns();
                    List<String> toCols = fk.getToColumns();
                    if (CollectionUtils.isEmpty(fromCols)) {
                        continue;
                    }
                    for (int i = 0; i < fromCols.size(); i++) {
                        String refCol = !CollectionUtils.isEmpty(toCols) && i < toCols.size()
                                ? toCols.get(i)
                                : (!CollectionUtils.isEmpty(toCols) ? toCols.get(0) : fk.getName());
                        if (refCol == null) {
                            refCol = "";
                        }
                        fkMap.put(fromCols.get(i), refCol);
                    }
                }
            }
        }

        List<String> columnParts = new ArrayList<>();
        if (!CollectionUtils.isEmpty(table.getColumns())) {
            table.getColumns().stream().sorted().forEach(col -> {
                StringBuilder entry = new StringBuilder();
                entry.append(col.getName()).append(" ").append(col.getType() == null ? "" : col.getType());
                if (pkColumns.contains(col.getName())) {
                    entry.append(" PK");
                }
                if (fkMap.containsKey(col.getName())) {
                    entry.append(" FK->").append(fkMap.get(col.getName()));
                }
                columnParts.add(entry.toString());
            });
        }

        String typeLabel = table.getType() == null ? "TABLE" : table.getType().name();
        return typeLabel + " " + table.getName() + " (" + String.join(", ", columnParts) + ")";
    }

    static Set<String> getFkReferencedTableNames(List<Table> tables, Set<String> referencedNames) {
        Set<String> fkTables = new HashSet<>();
        if (CollectionUtils.isEmpty(tables) || referencedNames.isEmpty()) {
            return fkTables;
        }
        for (Table table : tables) {
            if (!referencedNames.contains(table.getName()) || CollectionUtils.isEmpty(table.getKeys())) {
                continue;
            }
            for (Key key : table.getKeys()) {
                if (!(key instanceof ForeignKey fk)) {
                    continue;
                }
                if (CollectionUtils.isEmpty(fk.getToColumns())) {
                    continue;
                }
                for (String toCol : fk.getToColumns()) {
                    int dotIdx = toCol.indexOf('.');
                    if (dotIdx > 0) {
                        fkTables.add(toCol.substring(0, dotIdx));
                    }
                }
            }
        }
        return fkTables;
    }

    static String serializeWithPriority(DatasourceStructure structure, Set<String> referencedNames, int budget) {
        List<Table> tables = structure.getTables();
        int totalCount = tables.size();
        String header = "Database has " + totalCount + " table" + (totalCount == 1 ? "" : "s") + ".\n\n";

        List<String> fullLines = tables.stream()
                .map(AiDatasourceSchemaSerializerCE::serializeTable)
                .toList();
        String fullSchema = header + String.join("\n", fullLines);

        if (fullSchema.length() <= budget) {
            return fullSchema;
        }

        List<Table> priorityTables = new ArrayList<>();
        List<String> otherTableNames = new ArrayList<>();
        for (Table table : tables) {
            if (referencedNames.contains(table.getName())) {
                priorityTables.add(table);
            } else {
                otherTableNames.add(table.getName());
            }
        }

        String priorityPart = header
                + priorityTables.stream()
                        .map(AiDatasourceSchemaSerializerCE::serializeTable)
                        .reduce((a, b) -> a + "\n" + b)
                        .orElse("");
        StringBuilder result = new StringBuilder(priorityPart);
        if (!otherTableNames.isEmpty()) {
            result.append("\n\nOther tables: ").append(String.join(", ", otherTableNames));
        }

        if (result.length() <= budget) {
            return result.toString();
        }

        String truncationNotice =
                "\n[Schema truncated - " + priorityTables.size() + "/" + totalCount + " tables included in full]";
        int availableSpace = budget - truncationNotice.length();
        if (availableSpace > header.length()) {
            return result.substring(0, availableSpace) + truncationNotice;
        }
        return result.substring(0, budget);
    }
}
