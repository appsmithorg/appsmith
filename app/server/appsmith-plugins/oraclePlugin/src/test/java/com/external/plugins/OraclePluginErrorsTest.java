package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.external.plugins.exceptions.OraclePluginError;
import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.stream.Collectors;

import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.CONNECTION_POOL_CLOSED_ERROR_MSG;
import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.CONNECTION_POOL_NOT_RUNNING_ERROR_MSG;
import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.CONNECTION_POOL_NULL_ERROR_MSG;
import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.UNKNOWN_CONNECTION_ERROR_MSG;
import static com.external.plugins.OracleTestDBContainerManager.oracleDatasourceUtils;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class OraclePluginErrorsTest {
    @Test
    public void verifyUniquenessOfOraclePluginErrorCode() {
        assert (Arrays.stream(OraclePluginError.values())
                        .map(OraclePluginError::getAppErrorCode)
                        .distinct()
                        .count()
                == OraclePluginError.values().length);

        assert (Arrays.stream(OraclePluginError.values())
                        .map(OraclePluginError::getAppErrorCode)
                        .filter(appErrorCode -> appErrorCode.length() != 11 || !appErrorCode.startsWith("PE-ORC"))
                        .collect(Collectors.toList())
                        .size()
                == 0);
    }

    /**
     * Not repeating this test for other plugins because (1) their implementation is identical to this one. (2) We
     * want to re-factor this identical code into a common method in future (#24763) - could not be done right now because
     * of some package dependency issues.
     */
    @Test
    public void testStaleConnectionErrorHasUpstreamErrorWhenConnectionPoolIsNull() {
        Exception exception = assertThrows(
                StaleConnectionException.class,
                () -> oracleDatasourceUtils.checkHikariCPConnectionPoolValidity(null, "pluginName"));
        String expectedErrorMessage = CONNECTION_POOL_NULL_ERROR_MSG;
        assertEquals(expectedErrorMessage, exception.getMessage());
    }

    /**
     * Not repeating this test for other plugins because (1) their implementation is identical to this one. (2) We
     * want to re-factor this identical code into a common method in future (#24763) - could not be done right now because
     * of some package dependency issues.
     */
    @Test
    public void testStaleConnectionErrorHasUpstreamErrorWhenConnectionPoolIsClosed() {
        HikariDataSource mockConnectionPool = mock(HikariDataSource.class);
        when(mockConnectionPool.isClosed()).thenReturn(true).thenReturn(true);
        Exception exception = assertThrows(
                StaleConnectionException.class,
                () -> oracleDatasourceUtils.checkHikariCPConnectionPoolValidity(mockConnectionPool, "pluginName"));
        String expectedErrorMessage = CONNECTION_POOL_CLOSED_ERROR_MSG;
        assertEquals(expectedErrorMessage, exception.getMessage());
    }

    /**
     * Not repeating this test for other plugins because (1) their implementation is identical to this one. (2) We
     * want to re-factor this identical code into a common method in future (#24763) - could not be done right now because
     * of some package dependency issues.
     */
    @Test
    public void testStaleConnectionErrorHasUpstreamErrorWhenConnectionPoolIsRunning() {
        HikariDataSource mockConnectionPool = mock(HikariDataSource.class);
        when(mockConnectionPool.isRunning()).thenReturn(false).thenReturn(false);
        Exception exception = assertThrows(
                StaleConnectionException.class,
                () -> oracleDatasourceUtils.checkHikariCPConnectionPoolValidity(mockConnectionPool, "pluginName"));
        String expectedErrorMessage = CONNECTION_POOL_NOT_RUNNING_ERROR_MSG;
        assertEquals(expectedErrorMessage, exception.getMessage());
    }

    /**
     * Not repeating this test for other plugins because (1) their implementation is identical to this one. (2) We
     * want to re-factor this identical code into a common method in future (#24763) - could not be done right now because
     * of some package dependency issues.
     */
    @Test
    public void testStaleConnectionErrorHasDefaultUpstreamError() {
        HikariDataSource mockConnectionPool = mock(HikariDataSource.class);
        when(mockConnectionPool.isRunning()).thenReturn(false).thenReturn(true);
        Exception exception = assertThrows(
                StaleConnectionException.class,
                () -> oracleDatasourceUtils.checkHikariCPConnectionPoolValidity(mockConnectionPool, "pluginName"));
        String expectedErrorMessage = UNKNOWN_CONNECTION_ERROR_MSG;
        assertEquals(expectedErrorMessage, exception.getMessage());
    }
}
