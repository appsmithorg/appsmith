package com.external.plugins.utils;

import com.appsmith.external.models.DatasourceConfiguration;
import junit.framework.TestCase;

public class MongoPluginUtilsTest extends TestCase {

    public void testGetDatabaseName_withoutDatabaseName_defaultsToAdmin() {
        final String databaseName = MongoPluginUtils.getDatabaseName(new DatasourceConfiguration());

        assertEquals("admin", databaseName);
    }
}