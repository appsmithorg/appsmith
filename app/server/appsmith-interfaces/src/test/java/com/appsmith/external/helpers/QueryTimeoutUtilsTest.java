package com.appsmith.external.helpers;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.services.SharedConfig;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.sql.Statement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class QueryTimeoutUtilsTest {

    private final Statement statement = mock(Statement.class);

    private final SharedConfig sharedConfig = mock(SharedConfig.class);

    @ParameterizedTest
    @CsvSource({"1,1", "999,1", "1000,1", "1001,2", "10000,10", "60001,61"})
    void should_roundUpToWholeSeconds_when_convertingTimeout(int timeoutInMillisecond, int expectedSeconds) {
        // Given
        // When
        int seconds = QueryTimeoutUtils.toJdbcSeconds(timeoutInMillisecond);

        // Then
        assertThat(seconds).isEqualTo(expectedSeconds);
    }

    @Test
    void should_notSetQueryTimeout_when_cancelDisabled() throws Exception {
        // Given
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setTimeoutInMillisecond("2500");

        // When
        QueryTimeoutUtils.applyQueryTimeout(statement, actionConfiguration, false);

        // Then
        verify(statement, never()).setQueryTimeout(anyInt());
    }

    @Test
    void should_setQueryTimeoutFromActionTimeout_when_cancelEnabled() throws Exception {
        // Given
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setTimeoutInMillisecond("2500");

        // When
        QueryTimeoutUtils.applyQueryTimeout(statement, actionConfiguration, true);

        // Then
        verify(statement).setQueryTimeout(3);
    }

    @Test
    void should_useDefaultActionTimeout_when_actionTimeoutNotSet() throws Exception {
        // Given
        ActionConfiguration actionConfiguration = new ActionConfiguration();

        // When
        QueryTimeoutUtils.applyQueryTimeout(statement, actionConfiguration, true);

        // Then
        verify(statement).setQueryTimeout(10);
    }

    @Test
    void should_reportCancelDisabled_when_sharedConfigMissing() {
        // Given
        // When
        boolean enabled = QueryTimeoutUtils.isCancelEnabled(null);

        // Then
        assertThat(enabled).isFalse();
    }

    @Test
    void should_reportCancelEnabled_when_sharedConfigEnablesIt() {
        // Given
        when(sharedConfig.isQueryTimeoutCancelEnabled()).thenReturn(true);

        // When
        boolean enabled = QueryTimeoutUtils.isCancelEnabled(sharedConfig);

        // Then
        assertThat(enabled).isTrue();
    }
}
