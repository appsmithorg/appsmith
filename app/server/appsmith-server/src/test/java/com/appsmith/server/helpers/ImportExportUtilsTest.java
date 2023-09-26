package com.appsmith.server.helpers;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.MongoTransactionException;

import java.util.Map;
import java.util.Set;

class ImportExportUtilsTest {

    @Test
    void getErrorMessage_filterTransactionalError_returnEmptyString() {
        Throwable throwable = new MongoTransactionException(
                "Command failed with error 251 (NoSuchTransaction): 'Transaction 1 has been aborted.");
        String errorMessage = ImportExportUtils.getErrorMessage(throwable);
        Assertions.assertEquals(errorMessage, "");
    }

    @Test
    void getErrorMessage_genericException_returnActualMessage() {
        Throwable throwable = new AppsmithException(AppsmithError.GENERIC_JSON_IMPORT_ERROR);
        String errorMessage = ImportExportUtils.getErrorMessage(throwable);
        Assertions.assertEquals(errorMessage, "Error: " + throwable.getMessage());
    }

    @Test
    void isPageNameInUpdatedList() {
        String pageName = "Page1";
        Set<String> updatedPageNames = Set.of("Page1", "Page2");
        ApplicationJson applicationJson = new ApplicationJson();
        Assertions.assertFalse(ImportExportUtils.isPageNameInUpdatedList(applicationJson, pageName));

        applicationJson.setUpdatedResources(Map.of());
        Assertions.assertFalse(ImportExportUtils.isPageNameInUpdatedList(applicationJson, pageName));

        Map<String, Set<String>> stringSetMap = Map.of(FieldName.PAGE_LIST, Set.of("Page1", "Page2"));
        applicationJson.setUpdatedResources(stringSetMap);
        Assertions.assertTrue(ImportExportUtils.isPageNameInUpdatedList(applicationJson, pageName));

        Assertions.assertFalse(ImportExportUtils.isPageNameInUpdatedList(applicationJson, pageName.toLowerCase()));
        Assertions.assertFalse(ImportExportUtils.isPageNameInUpdatedList(applicationJson, "test"));
        Assertions.assertFalse(ImportExportUtils.isPageNameInUpdatedList(applicationJson, ""));
        Assertions.assertFalse(ImportExportUtils.isPageNameInUpdatedList(applicationJson, null));
    }
}
