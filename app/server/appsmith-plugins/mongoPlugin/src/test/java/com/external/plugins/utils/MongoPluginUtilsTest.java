package com.external.plugins.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.DatasourceConfiguration;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

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