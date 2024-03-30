package com.appsmith.server.helpers;

import com.appsmith.server.exceptions.AppsmithError;
import org.junit.jupiter.api.Test;

import java.util.Arrays;

import static com.appsmith.server.exceptions.util.DuplicateKeyExceptionUtils.extractConflictingObjectName;
import static org.assertj.core.api.Assertions.assertThat;

public class AppsmithErrorTest {
    @Test
    public void verifyUniquenessOfAppsmithErrorCode() {
        assert (Arrays.stream(AppsmithError.values())
                        .map(AppsmithError::getAppErrorCode)
                        .distinct()
                        .count()
                == AppsmithError.values().length);
    }

    @Test
    public void verifyDuplicateKeyExceptionDoesnotDiscloseSensitiveInformation() {
        // Context: https://github.com/appsmithorg/appsmith/issues/21568
        assertThat(
                        extractConflictingObjectName(
                                "Write operation error on server localhost:27017. Write error: WriteError{code=11000, message='E11000 duplicate key error collection: appsmith.actionCollection index: unpublishedCollection.name_1 dup key: { unpublishedCollection.name: \"MyJSObject\" }', details={}}."))
                .isEqualTo("MyJSObject");

        assertThat(
                        extractConflictingObjectName(
                                "Write operation error on server localhost:27017. Write error: WriteError{code=11000, message='E11000 duplicate key error collection: appsmith.datasource index: workspace_datasource_deleted_compound_index dup key: { workspaceId: \"66077c58e239b027ea2288f3\", name: \"Untitled datasource 3\", deletedAt: null }', details={}}."))
                .isEqualTo("Untitled datasource 3");
    }
}
