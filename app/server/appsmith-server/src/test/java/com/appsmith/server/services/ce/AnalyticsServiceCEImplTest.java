package com.appsmith.server.services.ce;

import com.appsmith.external.enums.FeatureFlagEnum;
import com.appsmith.server.services.FeatureFlagService;
import com.segment.analytics.Analytics;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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

    // Gap 2 regression guard: a direct sendEvent call for an anonymous user must be blocked when
    // configure_block_event_tracking_for_anonymous_users is on, so no event is enqueued to Segment.
    @Test
    void sendEvent_anonymousUserWithBlockFlagOn_doesNotEnqueueEvent() {
        Analytics analytics = mock(Analytics.class);
        FeatureFlagService featureFlagService = mock(FeatureFlagService.class);
        when(featureFlagService.check(FeatureFlagEnum.configure_block_event_tracking_for_anonymous_users))
                .thenReturn(Mono.just(true));

        // Only `analytics` (for isActive()) and `featureFlagService` (for the gate) are exercised on this
        // path; the remaining collaborators are unused because the flag short-circuits before they are read.
        AnalyticsServiceCEImpl analyticsService =
                new AnalyticsServiceCEImpl(analytics, null, null, null, null, null, null, null, featureFlagService);

        StepVerifier.create(analyticsService.sendEvent("execute_ACTION_TRIGGERED", "anonymousUser", Map.of("id", "x")))
                .verifyComplete();

        verify(analytics, never()).enqueue(any());
    }
}
