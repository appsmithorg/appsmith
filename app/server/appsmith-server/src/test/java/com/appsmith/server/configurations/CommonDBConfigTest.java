package com.appsmith.server.configurations;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class CommonDBConfigTest {

    @Test
    public void testExtractAndSaveJdbcParams_validDbUrlWithUsernameAndPassword() {
        CommonDBConfig commonDBConfig = new CommonDBConfig();
        String dbUrl = "postgresql://postgres:password@localhost/postgres";
        DataSourceProperties ds = commonDBConfig.extractJdbcProperties(dbUrl);
        assertEquals("postgres", ds.getUsername());
        assertEquals("password", ds.getPassword());
        assertEquals("jdbc:postgresql://localhost:5432/postgres?currentSchema=appsmith", ds.getUrl());

        String dbUrlWithPort = "postgresql://postgres:password@localhost:1234/postgres";
        ds = commonDBConfig.extractJdbcProperties(dbUrlWithPort);
        assertEquals("postgres", ds.getUsername());
        assertEquals("password", ds.getPassword());
        assertEquals("jdbc:postgresql://localhost:1234/postgres?currentSchema=appsmith", ds.getUrl());
    }

    @Test
    public void testExtractAndSaveJdbcParams_validDbUrlWithoutUsernameAndPassword() {
        CommonDBConfig commonDBConfig = new CommonDBConfig();
        String dbUrl = "postgresql://localhost:5432/postgres";
        DataSourceProperties ds = commonDBConfig.extractJdbcProperties(dbUrl);
        assertNull(ds.getUsername());
        assertNull(ds.getPassword());
        assertEquals("jdbc:postgresql://localhost:5432/postgres?currentSchema=appsmith", ds.getUrl());
    }

    @Test
    public void testExtractAndSaveJdbcParams_invalidDbUrl() {
        CommonDBConfig commonDBConfig = new CommonDBConfig();
        String dbUrl = "jdbc:postgresql://localhost/postgres";
        String errorString = String.format(
                "Malformed DB URL! Expected format: postgresql://{username}:{password}@localhost:{port}/{db_name}, provided url is %s",
                dbUrl);
        assertThrows(IllegalArgumentException.class, () -> commonDBConfig.extractJdbcProperties(dbUrl), errorString);
    }

    @Test
    void testExtractJdbcPropertiesWithQueryParams() {
        CommonDBConfig commonDBConfig = new CommonDBConfig();
        String dbUrl = "postgresql://user:password@localhost:5432/mydb?sslmode=require";

        DataSourceProperties dataSourceProperties = commonDBConfig.extractJdbcProperties(dbUrl);

        String expectedUrl = "jdbc:postgresql://localhost:5432/mydb?sslmode=require&currentSchema=appsmith";
        assertEquals(
                expectedUrl,
                dataSourceProperties.getUrl(),
                "URL with existing query params should append the currentSchema correctly.");
    }

    @Test
    void testExtractJdbcPropertiesWithoutQueryParams() {
        CommonDBConfig commonDBConfig = new CommonDBConfig();
        String dbUrl = "postgresql://user:password@localhost:5432/mydb";
        DataSourceProperties dataSourceProperties = commonDBConfig.extractJdbcProperties(dbUrl);

        String expectedUrl = "jdbc:postgresql://localhost:5432/mydb?currentSchema=appsmith";
        assertEquals(
                expectedUrl,
                dataSourceProperties.getUrl(),
                "URL without query params should append the currentSchema correctly.");
    }
}
