package com.appsmith.server.helpers;

import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.util.DuplicateKeyExceptionUtils;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DuplicateKeyException;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

public class AppsmithErrorTest {
    @Test
    public void verifyUniquenessOfAppsmithErrorCode() {
        final List<String> duplicateErrorCodes = Arrays.stream(AppsmithError.values())
                .collect(Collectors.groupingBy(AppsmithError::getAppErrorCode, Collectors.counting()))
                .entrySet()
                .stream()
                .filter(entry -> entry.getValue() > 1)
                .map(Map.Entry::getKey)
                .toList();

        assertThat(duplicateErrorCodes).isEmpty();
    }

    @Test
    public void verifyDuplicateKeyExceptionDoesnotDiscloseSensitiveInformation() {
        // Context: https://github.com/appsmithorg/appsmith/issues/21568
        final DuplicateKeyException exception =
                assertThrows(DuplicateKeyException.class, () -> generateDuplicateKeyException());

        AppsmithError appsmithError = AppsmithError.DUPLICATE_KEY;
        assertEquals(
                appsmithError.getMessage("\\\"MyJSObject\\\""),
                appsmithError.getMessage(
                        DuplicateKeyExceptionUtils.extractConflictingObjectName(exception.getMessage())));
    }

    private void generateDuplicateKeyException() {
        String originalErrorMessage =
                "Write operation error on server localhost:27017. Write error: WriteError{code=11000, message='E11000 duplicate key error collection: appsmith.actionCollection index: unpublishedCollection.name_1 dup key: { unpublishedCollection.name: \\\"MyJSObject\\\" }', details={}}.";
        throw new DuplicateKeyException(originalErrorMessage);
    }
}
