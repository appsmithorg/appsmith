package com.appsmith.server.services.ce;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class AnalyticsServiceCEImplTest {
    @Test
    void shouldHashUserId_anonymousUserIdCE_shouldReturnFalse() {
        Boolean shouldHash =
                AnalyticsServiceCEImpl.shouldHashUserId("execute_ACTION_TRIGGERED", "anonymousUser", true, false);
        assertEquals(false, shouldHash);
    }

    @Test
    void shouldHashUserId_nonAnonymousUserIdCE_shouldReturnTrue() {
        Boolean shouldHash =
                AnalyticsServiceCEImpl.shouldHashUserId("execute_ACTION_TRIGGERED", "test_id", true, false);
        assertEquals(true, shouldHash);
    }

    @Test
    void shouldHashUserId_anonymousUserIdCloud_shouldReturnFalse() {
        Boolean shouldHash =
                AnalyticsServiceCEImpl.shouldHashUserId("execute_ACTION_TRIGGERED", "anonymousUser", true, true);
        assertEquals(false, shouldHash);
    }
}
