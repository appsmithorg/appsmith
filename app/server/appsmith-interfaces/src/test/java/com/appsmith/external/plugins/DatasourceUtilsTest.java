package com.appsmith.external.plugins;

import com.appsmith.external.helpers.restApiUtils.helpers.DatasourceUtils;
import com.appsmith.external.models.DatasourceConfiguration;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class DatasourceUtilsTest {
    @Test
    public void testValidateDatasourceSkipsEmptyUrlCheck() {
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        DatasourceUtils datasourceUtils = new DatasourceUtils();
        Set<String> invalids = datasourceUtils.validateDatasource(dsConfig);
        assertTrue(invalids.isEmpty());
    }
}
