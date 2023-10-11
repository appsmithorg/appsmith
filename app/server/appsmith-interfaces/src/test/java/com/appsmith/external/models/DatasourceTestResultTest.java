package com.appsmith.external.models;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class DatasourceTestResultTest {

    @Test
    public void testNewDatasourceTestResult_NullInvalidArray() {
        DatasourceTestResult nullInvalidsResult = new DatasourceTestResult((String) null);
        assertNotNull(nullInvalidsResult);
        assertTrue(nullInvalidsResult
                .getInvalids()
                .contains(AppsmithPluginError.PLUGIN_DATASOURCE_TEST_GENERIC_ERROR.getMessage()));

        nullInvalidsResult = new DatasourceTestResult(new String[] {null});
        assertNotNull(nullInvalidsResult);
        assertTrue(nullInvalidsResult
                .getInvalids()
                .contains(AppsmithPluginError.PLUGIN_DATASOURCE_TEST_GENERIC_ERROR.getMessage()));
    }
}
