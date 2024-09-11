package com.appsmith.server.migrations.ce;

import com.appsmith.server.configurations.ProjectProperties;
import com.appsmith.server.migrations.AppsmithJavaMigration;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectReader;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Date;
import java.sql.ResultSetMetaData;
import java.sql.Types;
import java.time.Instant;
import java.util.Base64;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.stream.Stream;

@Slf4j
public class V002__loadMongoData extends AppsmithJavaMigration {
    final ObjectMapper objectMapper = new ObjectMapper();

    // Use a `LinkedHashMap` so we get the same order when iterating over keys or values.
    final ObjectReader objectReader = objectMapper.readerFor(LinkedHashMap.class);

    private static final Pattern UUID_OR_OBJECTID_PATTERN =
            Pattern.compile("([\":])([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[0-9a-f]{24})(\")");
    private static final String MONGO_DATA_NAME = "mongo-data";

    final Map<String, String> idMap = new HashMap<>();

    private static Path findEffectiveDataPath() {
        // MongoDB export placed in Stacks volume, in Docker container.
        final Path mongoDataInStacks = Path.of("/", "appsmith-stacks", MONGO_DATA_NAME);
        if (Files.exists(mongoDataInStacks)) {
            return mongoDataInStacks;
        }

        // Find where `opt/appsmith` folder is located.
        // In Docker container, we'll find it at `/opt/appsmith`.
        // In dev systems, we look for the `deploy` folder, navigating upwards.
        Path optAppsmith = Path.of("/", "opt", "appsmith");
        if (!Files.exists(optAppsmith)) {
            Path current = Path.of(".").toAbsolutePath();
            while (!Files.exists(current.resolve("deploy"))) {
                current = current.getParent();
                if (current == null) {
                    throw new RuntimeException("No baseline folder found");
                }
            }
            optAppsmith = current.resolve(Path.of("deploy", "docker", "fs", "opt", "appsmith"));
        }

        // Is there MongoDB export in optAppsmith?
        if (Files.exists(optAppsmith.resolve(MONGO_DATA_NAME))) {
            return optAppsmith.resolve(MONGO_DATA_NAME);
        }

        // Otherwise, just return baseline data path.
        return optAppsmith.resolve("baseline-" + ProjectProperties.EDITION.toLowerCase());
    }

    @Override
    public void migrate(JdbcTemplate jdbcTemplate) throws Exception {
        final Path effectiveDataRoot = findEffectiveDataPath();
        final boolean isCustomerExistingDataPresent = effectiveDataRoot.endsWith(MONGO_DATA_NAME);

        // Iterate over files in `effectiveDataRoot`, use the name as the `collectionName` and process them.
        try (final Stream<Path> items = Files.list(effectiveDataRoot).sorted()) {
            items.forEach(item -> {
                final String name = item.toFile().getName();
                if (!name.endsWith(".jsonl")) {
                    return;
                }
                moveForTable(item, jdbcTemplate, isCustomerExistingDataPresent);
            });
        }
    }

    private void moveForTable(Path jsonlPath, JdbcTemplate jdbcTemplate, boolean isCustomerExistingDataPresent) {
        final Map<String, Integer> columnTypes = new LinkedHashMap<>();

        final String collectionName = jsonlPath.toFile().getName().replace(".jsonl", "");
        final String tableName = camelToSnakeCase(collectionName);

        if (!isTableExists(jdbcTemplate, tableName)) {
            log.warn("Ignoring jsonl file as table doesn't exist: {}", jsonlPath);
            return;
        }
        log.info("Importing data to table: {}", tableName);

        try {
            jdbcTemplate.query("SELECT * FROM \"" + tableName + "\" LIMIT 1", rs -> {
                final ResultSetMetaData metaData = rs.getMetaData();
                for (int i = 1; i <= metaData.getColumnCount(); i++) {
                    columnTypes.put(metaData.getColumnName(i), metaData.getColumnType(i));
                }
                return columnTypes;
            });
        } catch (Exception e) {
            System.err.println("Error for " + tableName + ": " + e.getMessage());
            throw e;
        }

        try (Stream<String> lines = Files.lines(jsonlPath, StandardCharsets.UTF_8)) {
            lines.forEach(line -> {
                if (line.isEmpty()) {
                    return;
                }

                // Replace ObjectId values in the base data with new random UUIDs.
                if (!isCustomerExistingDataPresent) {
                    line = UUID_OR_OBJECTID_PATTERN.matcher(line).replaceAll(match -> {
                        String objectId = match.group(2);
                        if (!idMap.containsKey(objectId)) {
                            idMap.put(objectId, UUID.randomUUID().toString());
                        }
                        return match.group(1) + idMap.get(objectId) + match.group(3);
                    });
                }

                // Load the field values from the JSON document in the current line.
                final Map<String, Object> data;
                try {
                    data = objectReader.readValue(line);
                } catch (IOException e) {
                    throw new RuntimeException(e);
                }

                // Convert keys to snake-case, so that they match the table columns in Postgres.
                for (String key : new HashSet<>(data.keySet())) {
                    final Object value = data.remove(key);
                    final String snakeKey = camelToSnakeCase(key);
                    if (columnTypes.containsKey(snakeKey)) {
                        // We only care about it if it exists as a column in our table.
                        data.put(snakeKey, value);
                    }
                }

                // Update the `created_at` and `updated_at` if migrating data from baseline data.
                if (!isCustomerExistingDataPresent) {
                    Instant now = Instant.now();
                    if (columnTypes.containsKey("created_at")) {
                        data.put("created_at", now.toString());
                    }
                    if (columnTypes.containsKey("updated_at")) {
                        data.put("updated_at", now.toString());
                    }
                }

                // Build the INSERT query to only have the columns that are present in the JSON document. This allows
                // the rest of the columns to take on their default value, if configured, instead of `null`.
                final String sql = String.join(
                        "",
                        "INSERT INTO \"",
                        tableName,
                        "\" (\"",
                        String.join("\", \"", data.keySet()),
                        "\") VALUES (",
                        String.join(", ", data.keySet().stream().map(i -> "?").toList()),
                        ")");

                try {
                    jdbcTemplate.update(sql, ps -> {
                        int i = 1;
                        for (String columnName : data.keySet()) {
                            final Integer type = columnTypes.get(columnName);
                            if (type == null) {
                                // There's no corresponding column in our table for this field, likely we just don't
                                // care
                                // for its value anymore.
                                continue;
                            }
                            Object value = data.get(columnName);
                            if (value instanceof String stringValue && type == Types.TIMESTAMP) {
                                value = Date.from(Instant.parse(stringValue));
                            } else if (value instanceof String stringValue && type == Types.BINARY) {
                                if ("customjslib".equals(tableName) && "defs".equals(columnName)) {
                                    // This column is being changed from "string" in MongoDB, to "bytea" in Postgres.
                                    // This is because this column is very likely to contain NUL bytes in it, and
                                    // Postgres doesn't allow NUL bytes in text/varchar type columns.
                                    value = stringValue.getBytes(StandardCharsets.UTF_8);
                                } else {
                                    value = Base64.getDecoder().decode(stringValue);
                                }
                            } else if (value instanceof Collection<?> || value instanceof Map<?, ?>) {
                                try {
                                    value = objectMapper.writeValueAsString(value);
                                    if (((String) value).contains("u0000")) {
                                        log.warn(
                                                "Removing NUL characters from {}.{} for id {}",
                                                tableName,
                                                columnName,
                                                data.get("id"));
                                        value = ((String) value).replaceAll("\\\\u0000", "");
                                    }
                                } catch (JsonProcessingException e) {
                                    throw new RuntimeException(e);
                                }
                            }

                            if (value instanceof String stringValue && stringValue.contains("\u0000")) {
                                log.warn(
                                        "Removing NUL characters from {}.{} for id {}",
                                        tableName,
                                        columnName,
                                        data.get("id"));
                                // If it's a string we're inserting, just nuke NUL characters.
                                value = stringValue.replaceAll("\u0000", "");
                            }

                            ps.setObject(i, value, type);
                            ++i;
                        }
                    });
                } catch (RuntimeException e) {
                    System.err.println("Error for " + tableName + ": " + e.getMessage());
                    throw e;
                }
            });
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private boolean isTableExists(JdbcTemplate jdbcTemplate, String tableName) {
        //noinspection DataFlowIssue  // false positive
        return jdbcTemplate.query(
                """
                SELECT exists(SELECT FROM information_schema.tables
                    WHERE table_schema = current_schema AND table_name = ?)
                """,
                ps -> ps.setString(1, tableName),
                rs -> {
                    rs.next();
                    return rs.getBoolean(1);
                });
    }

    private String camelToSnakeCase(String str) {
        // Table/collection names are known to be always in English.
        // Convert "user" to "user".
        // Convert "userData" to "user_data".
        // Convert "userPermissionGroup" to "user_permission_group".
        // Convert "customJSLib" to "customjslib".
        // Convert "assignedToUserIds" to "assigned_to_user_ids".
        return str.replaceAll("([a-z])([A-Z](?=[a-z]))", "$1_$2").toLowerCase(Locale.ENGLISH);
    }
}
