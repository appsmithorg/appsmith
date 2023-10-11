package com.appsmith.external.models;

import org.junit.jupiter.api.Test;

import static com.appsmith.external.constants.PluginConstants.DEFAULT_REST_DATASOURCE;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class DatasourceStorageTest {
    @Test
    public void testIsEmbeddedDatasourceWithNameMismatch() {
        DatasourceStorage datasourceStorage = new DatasourceStorage();
        assertFalse(datasourceStorage.isEmbedded());
    }

    @Test
    public void testIsEmbeddedDatasourceWithNonNullId() {
        DatasourceStorage datasourceStorage = new DatasourceStorage();
        datasourceStorage.setDatasourceId("id");
        assertFalse(datasourceStorage.isEmbedded());
    }

    @Test
    public void testIsEmbeddedDatasourceWithNullIdAndNameMatch() {
        DatasourceStorage datasourceStorage = new DatasourceStorage();
        datasourceStorage.setName(DEFAULT_REST_DATASOURCE);
        assertTrue(datasourceStorage.isEmbedded());
    }
}
