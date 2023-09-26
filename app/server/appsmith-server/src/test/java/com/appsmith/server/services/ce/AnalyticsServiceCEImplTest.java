package com.appsmith.server.services.ce;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class AnalyticsServiceCEImplTest {
    @Test
    void shouldHashUserId_anonymousUserId_shouldReturnFalse() {
        Boolean shouldHash = AnalyticsServiceCEImpl.shouldHashUserId("execute_ACTION_TRIGGERED", "anonymouseUser");
        assertEquals(false, shouldHash);
    }

    @Test
    void shouldHashUserId_nonAnonymousUserId_shouldReturnTrue() {
        Boolean shouldHash = AnalyticsServiceCEImpl.shouldHashUserId("execute_ACTION_TRIGGERED", "test_id");
        assertEquals(true, shouldHash);
    }
}
