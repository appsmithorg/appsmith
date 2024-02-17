package com.appsmith.server.migrations;

import com.mongodb.client.MongoCollection;
import jakarta.annotation.PostConstruct;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.lang.reflect.Field;
import java.sql.Connection;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;

/**
 * This PoC doesn't hold much promise now.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class MoveToPostgres {

    private final JdbcTemplate jdbcTemplate;

    private final DataSource dataSource;

    private final MongoTemplate mongoTemplate;

    @SneakyThrows
    @PostConstruct
    @Transactional
    public void move() {
        final Connection connection = dataSource.getConnection();

        final Set<String> collectionNames = mongoTemplate.getCollectionNames();
        for (String collectionName : collectionNames) {
            final MongoCollection<Document> collection = mongoTemplate.getCollection(collectionName);

            final String tableName = toSnakeCase(collectionName);

            final ResultSet tables = connection.getMetaData().getTables(null, null, tableName, null);
            tables.next();
            System.out.println(tables.getObject(0));

            collection.find().forEach(doc -> {
                final Class<?> cls;
                try {
                    cls = Class.forName(doc.getString("_class"));
                } catch (ClassNotFoundException e) {
                    throw new RuntimeException(e);
                }

                final var entries = new ArrayList<>(doc.entrySet());
                final List<String> columnNames = new ArrayList<>();
                final List<String> valuePlaceholders = new ArrayList<>();
                final List<Object> valueArgs = new ArrayList<>();

                final Field[] classFields = cls.getDeclaredFields();
                System.out.println(Arrays.toString(classFields));

                for (final Field field : classFields) {
                    final String columnName = toSnakeCase(field.getName());
                    columnNames.add(columnName);
                    valuePlaceholders.add("?");
                    valueArgs.add(doc.get(field.getName()));
                }

                for (final var entry : entries) {
                    String key = entry.getKey();

                    if ("_class".equals(key)) {
                        continue;
                    } else if ("_id".equals(key)) {
                        key = "id";
                    }

                    columnNames.add("\"" + toSnakeCase(key) + "\"");

                    final Object value = entry.getValue();
                    valuePlaceholders.add("?");
                    if ("id".equals(key)) {
                        if (value instanceof ObjectId) {
                            valueArgs.add(value.toString());
                        } else {
                            valueArgs.add(value);
                        }
                    } else {
                        valueArgs.add(null);
                    }
                }

                final String sql = "INSERT INTO " + tableName + " (" + String.join(", ", columnNames) + ") VALUES ("
                        + String.join(", ", valuePlaceholders) + ")";

                // jdbcTemplate.query("select * from " + tableName + " limit 1", );

                log.debug("Moving {}.{}", collectionName, doc.get("_id"));
                jdbcTemplate.update(sql, valueArgs.toArray(new Object[entries.size()]));
            });
        }
    }

    private static String toSnakeCase(String camelCase) {
        return camelCase.replaceAll("([a-z])([A-Z][a-z])", "$1_$2").toLowerCase();
    }
}
