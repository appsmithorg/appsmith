package com.appsmith.external.models;

import org.junit.Test;

import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

public class DatasourceTestResultTest {

    @Test
    public void testNewDatasourceTestResult_NullInvalidArray() {
        DatasourceTestResult nullInvalidsResult = new DatasourceTestResult((String) null);
        assertNotNull(nullInvalidsResult);
        assertTrue(nullInvalidsResult.getInvalids().contains("Unable to test datasource with the given configuration. Please reach out to Appsmith customer support to report this"));

        nullInvalidsResult = new DatasourceTestResult(new String[]{null});
        assertNotNull(nullInvalidsResult);
        assertTrue(nullInvalidsResult.getInvalids().contains("Unable to test datasource with the given configuration. Please reach out to Appsmith customer support to report this"));
    }
}