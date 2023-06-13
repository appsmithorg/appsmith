/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.helpers;

import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.InvalidDataAccessApiUsageException;
import org.springframework.data.mongodb.MongoTransactionException;
import org.springframework.transaction.TransactionException;

@Slf4j
public class ImportExportUtils {

    /**
     * Method to provide non-cryptic and user-friendly error message with actionable input for Import-Export flows
     *
     * @param throwable Exception from which the user-friendly message needs to be extracted
     * @return Error message string
     */
    public static String getErrorMessage(Throwable throwable) {
        log.error("Error while importing the application, reason: {}", throwable.getMessage());
        // TODO provide actionable insights for different error messages generated from import-export flow
        // Filter out transactional error as these are cryptic and don't provide much info on the error
        return throwable instanceof TransactionException
                        || throwable instanceof MongoTransactionException
                        || throwable instanceof InvalidDataAccessApiUsageException
                ? ""
                : "Error: " + throwable.getMessage();
    }
}
