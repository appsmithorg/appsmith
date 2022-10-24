package com.external.plugins.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.DatasourceConfiguration;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

public class MongoPluginUtilsTest {

    @Test
    void testGetDatabaseName_withoutDatabaseName_throwsDatasourceError() {
        final AppsmithPluginException exception = assertThrows(
                AppsmithPluginException.class,
                () -> MongoPluginUtils.getDatabaseName(new DatasourceConfiguration()));

        assertEquals("Missing default database name.", exception.getMessage());

    }

    @Test
    void testParseSafely_Success() {
        assertNotNull(MongoPluginUtils.parseSafely("field", "{\"$set\":{name: \"Ram singh\"}}"));
    }

    @Test
    void testParseSafely_FailureOnArrayValues() {
        assertThrows(AppsmithPluginException.class,
                () -> MongoPluginUtils.parseSafely("field", "[{\"$set\":{name: \"Ram singh\"}},{\"$set\":{age: 40}}]"));
    }

    @Test
    void testParseSafelyDocumentAndArrayOfDocuments_Success() {
        assertNotNull(MongoPluginUtils.parseSafelyDocumentAndArrayOfDocuments("field", "{\"$set\":{name: \"Ram singh\"}}"));
    }

    @Test
    void testParseSafelyDocumentAndArrayOfDocumentst_FailureOnNonJsonValue() {
        assertThrows(AppsmithPluginException.class,
                () -> MongoPluginUtils.parseSafelyDocumentAndArrayOfDocuments("field", "{abc, pqr}"));
    }

    @Test
    void testParseSafelyDocumentAndArrayOfDocuments_OnArrayValues_Success() {
        assertNotNull(MongoPluginUtils.parseSafelyDocumentAndArrayOfDocuments("field",
                "[{\"$set\":{name: \"Ram singh\"}},{\"$set\":{age: 40}}]"));
    }

    @Test
    void testParseSafelyDocumentAndArrayOfDocuments_OnArrayValues_EmptyArray_Success() {
        assertNotNull(MongoPluginUtils.parseSafelyDocumentAndArrayOfDocuments("field", "[]"));
    }

    @Test
    void testParseSafelyDocumentAndArrayOfDocuments_onArrayValues_FailureOnNonJsonValue() {
        assertThrows(AppsmithPluginException.class,
                () -> MongoPluginUtils.parseSafelyDocumentAndArrayOfDocuments("field", "[abc, pqr]"));
    }

}