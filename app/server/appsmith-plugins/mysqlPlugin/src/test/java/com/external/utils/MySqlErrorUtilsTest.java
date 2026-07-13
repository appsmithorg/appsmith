package com.external.utils;

import io.r2dbc.spi.R2dbcNonTransientResourceException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

public class MySqlErrorUtilsTest {

    private final MySqlErrorUtils mySqlErrorUtils = MySqlErrorUtils.getInstance();

    @Test
    public void testGetReadableError_stripsHostFromAccessDeniedMessage() {
        R2dbcNonTransientResourceException error = new R2dbcNonTransientResourceException(
                "[9000] [H1000] Fail to establish connection to 10.0.0.5:3306 : "
                        + "Access denied for user 'mysql'@'10.0.0.5' (using password: NO)");

        String readableError = mySqlErrorUtils.getReadableError(error);

        assertEquals("Access denied for user 'mysql'", readableError);
        assertFalse(readableError.contains("10.0.0.5"));
    }

    @Test
    public void testGetReadableError_preservesUsernameContainingAtSymbol() {
        R2dbcNonTransientResourceException error = new R2dbcNonTransientResourceException(
                "[9000] [H1000] Fail to establish connection to 10.0.0.5:3306 : "
                        + "Access denied for user 'me@localhost'@'10.0.0.5' (using password: NO)");

        String readableError = mySqlErrorUtils.getReadableError(error);

        assertEquals("Access denied for user 'me@localhost'", readableError);
        assertFalse(readableError.contains("10.0.0.5"));
    }
}
