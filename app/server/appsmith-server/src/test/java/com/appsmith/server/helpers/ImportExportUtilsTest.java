package com.appsmith.server.helpers;

import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.MongoTransactionException;

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
}
