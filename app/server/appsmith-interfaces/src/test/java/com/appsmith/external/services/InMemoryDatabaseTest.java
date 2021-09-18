package com.appsmith.external.services;

import com.appsmith.external.constants.DataType;
import org.junit.Test;

import java.sql.SQLException;
import java.util.Map;

import static com.appsmith.external.services.InMemoryDatabase.generateTable;

public class InMemoryDatabaseTest {

    @Test
    public void testGenerateTable() throws SQLException {
        Map<String, DataType> schema = Map.of(
                "id", DataType.INTEGER,
                "name", DataType.STRING,
                "status", DataType.BOOLEAN
        );

        String table = generateTable(schema);

        System.out.println(table);

    }
}
