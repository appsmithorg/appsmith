package com.appsmith.server.configurations;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class CommonDBConfigTest {

    @Test
    public void testExtractAndSaveJdbcParams_validDbUrlWithUsernameAndPassword() {
        CommonDBConfig commonDBConfig = new CommonDBConfig();
        String dbUrl = "jdbc:postgresql://postgres:password@localhost/postgres";
        DataSourceProperties ds = commonDBConfig.extractJdbcProperties(dbUrl);
        assertEquals("postgres", ds.getUsername());
        assertEquals("password", ds.getPassword());
        assertEquals("jdbc:postgresql://localhost:5432/postgres", ds.getUrl());

        String dbUrlWithPort = "jdbc:postgresql://postgres:password@localhost:5432/postgres";
        ds = commonDBConfig.extractJdbcProperties(dbUrlWithPort);
        assertEquals("postgres", ds.getUsername());
        assertEquals("password", ds.getPassword());
        assertEquals("jdbc:postgresql://localhost:5432/postgres", ds.getUrl());
    }

    @Test
    public void testExtractAndSaveJdbcParams_validDbUrlWithoutUsernameAndPassword() {
        CommonDBConfig commonDBConfig = new CommonDBConfig();
        String dbUrl = "jdbc:postgresql://localhost:5432/postgres";
        DataSourceProperties ds = commonDBConfig.extractJdbcProperties(dbUrl);
        assertNull(ds.getUsername());
        assertNull(ds.getPassword());
        assertEquals("jdbc:postgresql://localhost:5432/postgres", ds.getUrl());
    }
}
