package com.appsmith.server.services.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.enums.FeatureFlagEnum;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.DeploymentProperties;
import com.appsmith.server.configurations.ProjectProperties;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.SessionUserService;
import com.segment.analytics.Analytics;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
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

    // If the flag state can't be resolved, the gate must fail closed: complete without error (so
    // fire-and-forget callers' chains don't break) and drop the anonymous event.
    @Test
    void sendEvent_anonymousUserWhenFlagCheckErrors_completesWithoutEnqueueing() {
        Analytics analytics = mock(Analytics.class);
        FeatureFlagService featureFlagService = mock(FeatureFlagService.class);
        when(featureFlagService.check(FeatureFlagEnum.configure_block_event_tracking_for_anonymous_users))
                .thenReturn(Mono.error(new RuntimeException("flag service unavailable")));

        AnalyticsServiceCEImpl analyticsService =
                new AnalyticsServiceCEImpl(analytics, null, null, null, null, null, null, null, featureFlagService);

        StepVerifier.create(analyticsService.sendEvent("execute_ACTION_TRIGGERED", "anonymousUser", Map.of("id", "x")))
                .verifyComplete();

        verify(analytics, never()).enqueue(any());
    }

    // Same fail-closed contract for sendObjectEvent: a flag-resolution error for an anonymous session must
    // drop the event and still emit the original object, instead of erroring the business flow this
    // analytics call is chained into.
    @Test
    void sendObjectEvent_anonymousSessionWhenFlagCheckErrors_returnsObjectWithoutEnqueueing() {
        Analytics analytics = mock(Analytics.class);
        FeatureFlagService featureFlagService = mock(FeatureFlagService.class);
        SessionUserService sessionUserService = mock(SessionUserService.class);
        // No session user -> sendObjectEvent falls back to its internal anonymous user.
        when(sessionUserService.getCurrentUser()).thenReturn(Mono.empty());
        when(featureFlagService.check(FeatureFlagEnum.configure_block_event_tracking_for_anonymous_users))
                .thenReturn(Mono.error(new RuntimeException("flag service unavailable")));

        AnalyticsServiceCEImpl analyticsService = new AnalyticsServiceCEImpl(
                analytics, sessionUserService, null, null, null, null, null, null, featureFlagService);

        Workspace workspace = new Workspace();
        workspace.setId("test-workspace-id");

        StepVerifier.create(analyticsService.sendObjectEvent(AnalyticsEvents.CREATE, workspace))
                .expectNext(workspace)
                .verifyComplete();

        verify(analytics, never()).enqueue(any());
    }

    // Deleting a user must not mint a Segment identity for the deleted user: user events are keyed by the
    // object user, so each deletion would otherwise count as a new tracked user that never acts again.
    @Test
    void sendObjectEvent_deleteUser_returnsObjectWithoutEnqueueing() {
        Analytics analytics = mock(Analytics.class);
        AnalyticsServiceCEImpl analyticsService = analyticsServiceWithLoggedInAdmin(analytics);

        User deletedUser = new User();
        deletedUser.setId("user-to-delete");
        deletedUser.setEmail("leaver@example.com");

        StepVerifier.create(analyticsService.sendObjectEvent(
                        AnalyticsEvents.DELETE, deletedUser, Map.of("isProvisioned", false)))
                .expectNext(deletedUser)
                .verifyComplete();

        verify(analytics, never()).enqueue(any());
    }

    // The guard is specific to user deletions: other object events from the same session still reach Segment.
    @Test
    void sendObjectEvent_deleteWorkspace_stillEnqueues() {
        Analytics analytics = mock(Analytics.class);
        AnalyticsServiceCEImpl analyticsService = analyticsServiceWithLoggedInAdmin(analytics);

        Workspace workspace = new Workspace();
        workspace.setId("workspace-1");

        StepVerifier.create(analyticsService.sendObjectEvent(AnalyticsEvents.DELETE, workspace, Map.of()))
                .expectNext(workspace)
                .verifyComplete();

        verify(analytics, times(1)).enqueue(any());
    }

    private static AnalyticsServiceCEImpl analyticsServiceWithLoggedInAdmin(Analytics analytics) {
        User admin = new User();
        admin.setEmail("admin@example.com");
        admin.setOrganizationId("org-1");
        SessionUserService sessionUserService = mock(SessionUserService.class);
        when(sessionUserService.getCurrentUser()).thenReturn(Mono.just(admin));

        // Cloud hosting keeps the user id unhashed, which is exactly the case the delete guard protects.
        CommonConfig commonConfig = mock(CommonConfig.class);
        when(commonConfig.getIsCloudHosting()).thenReturn(true);
        when(commonConfig.getAdminEmailDomainHash()).thenReturn("admin-domain-hash");

        ConfigService configService = mock(ConfigService.class);
        when(configService.getInstanceId()).thenReturn(Mono.just("instance-id"));

        ProjectProperties projectProperties = mock(ProjectProperties.class);
        when(projectProperties.getVersion()).thenReturn("v1.0.0-test");

        return new AnalyticsServiceCEImpl(
                analytics,
                sessionUserService,
                commonConfig,
                configService,
                null, // userUtils
                projectProperties,
                mock(DeploymentProperties.class),
                null, // userDataRepository
                null); // featureFlagService: not consulted for a logged-in session user
    }
}
