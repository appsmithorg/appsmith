package com.appsmith.external.plugins;

import com.appsmith.external.helpers.restApiUtils.helpers.DatasourceUtils;
import com.appsmith.external.models.DatasourceConfiguration;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class DatasourceUtilsTest {
    @Test
    public void testValidateDatasourceSkipsEmptyUrlCheckIfEmbedded() {
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        DatasourceUtils datasourceUtils = new DatasourceUtils();
        Set<String> invalids = datasourceUtils.validateDatasource(dsConfig, true);
        assertTrue(invalids.isEmpty());
    }

    @Test
    public void testValidateDatasourceAddsEmptyUrlInvalidIfNotEmbedded() {
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        DatasourceUtils datasourceUtils = new DatasourceUtils();
        Set<String> invalids = datasourceUtils.validateDatasource(dsConfig, false);
        assertTrue(invalids.contains("Missing URL."));
    }
}
