package com.external.utils;

import io.r2dbc.spi.R2dbcPermissionDeniedException;
import org.junit.Before;
import org.junit.Test;

import static org.junit.Assert.*;

public class MySqlErrorUtilsTest {

    private String errorMessage;

    @Before
    public void setUp() {
        errorMessage = "Access denied for user 'mysql'@'172.17.0.1' (using password: NO)";
    }

    @Test
    public void getReadableErrorForR2dbcPermissionDeniedException() throws InstantiationException {
        R2dbcPermissionDeniedException r2dbcPermissionDeniedException = new R2dbcPermissionDeniedException(errorMessage);
        String readableError = MySqlErrorUtils.getInstance().getReadableError(r2dbcPermissionDeniedException);
        assertFalse(readableError == null);
        assertEquals("Access denied for user 'mysql'@'172.17.0.1' using password: NO.", readableError);
    }
}