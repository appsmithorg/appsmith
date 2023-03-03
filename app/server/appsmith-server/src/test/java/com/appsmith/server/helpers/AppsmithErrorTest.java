package com.appsmith.server.helpers;

import com.appsmith.server.exceptions.AppsmithError;
import org.junit.jupiter.api.Test;

import java.util.Arrays;

public class AppsmithErrorTest {
    @Test
    public void verifyUniquenessOfAppsmithErrorCode() {
        assert (Arrays.stream(AppsmithError.values()).map(AppsmithError::getAppErrorCode).distinct().count() == AppsmithError.values().length);

    }
}
