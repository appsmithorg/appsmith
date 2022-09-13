package com.external.plugins.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.DatasourceConfiguration;
import org.junit.Test;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertThrows;

public class MongoPluginUtilsTest {

    @Test
    public void testGetDatabaseName_withoutDatabaseName_throwsDatasourceError() {
        final AppsmithPluginException exception = assertThrows(
                AppsmithPluginException.class,
                () -> MongoPluginUtils.getDatabaseName(new DatasourceConfiguration())
        );

        assertEquals("Missing default database name.", exception.getMessage());

    }
}