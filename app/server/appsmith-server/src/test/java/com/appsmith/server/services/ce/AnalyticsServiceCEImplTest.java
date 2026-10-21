package com.appsmith.server.services.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.enums.FeatureFlagEnum;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.DeploymentProperties;
import com.appsmith.server.configurations.ProjectProperties;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.SessionUserService;
import com.segment.analytics.Analytics;
import com.segment.analytics.messages.MessageBuilder;
import com.segment.analytics.messages.TrackMessage;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.ArgumentCaptor;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.Map;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
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

    // Deleting a user must not mint a Segment identity for the deleted user: user events are keyed by the
    // object user, so each deletion would otherwise count as a new tracked user that never acts again.
    @Test
    void sendObjectEvent_deleteUser_returnsObjectWithoutEnqueueing() {
        Analytics analytics = mock(Analytics.class);
        AnalyticsServiceCEImpl analyticsService = analyticsService(analytics, loggedInAdmin());

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
        AnalyticsServiceCEImpl analyticsService = analyticsService(analytics, loggedInAdmin());

        Workspace workspace = new Workspace();
        workspace.setId("workspace-1");

        StepVerifier.create(analyticsService.sendObjectEvent(AnalyticsEvents.DELETE, workspace, Map.of()))
                .expectNext(workspace)
                .verifyComplete();

        verify(analytics, times(1)).enqueue(any());
    }

    static Stream<Arguments> segmentSuppressedObjectEvents() {
        NewPage page = new NewPage();
        page.setId("page-1");
        NewAction action = new NewAction();
        action.setId("action-1");
        ActionCollection actionCollection = new ActionCollection();
        actionCollection.setId("collection-1");
        User user = new User();
        user.setId("user-1");
        user.setEmail("someone@example.com");
        DatasourceStorage datasourceStorage = new DatasourceStorage();
        datasourceStorage.setId("storage-1");

        return Stream.of(
                Arguments.of("view_NEWPAGE", AnalyticsEvents.VIEW, page, Map.of()),
                Arguments.of("update_layout", AnalyticsEvents.UPDATE_LAYOUT, page, Map.of()),
                Arguments.of("update_NEWACTION", AnalyticsEvents.UPDATE, action, Map.of()),
                Arguments.of("update_ACTIONCOLLECTION", AnalyticsEvents.UPDATE, actionCollection, Map.of()),
                Arguments.of("login_USER", AnalyticsEvents.LOGIN, user, Map.of()),
                Arguments.of("logout_USER", AnalyticsEvents.LOGOUT, user, Map.of()),
                Arguments.of(
                        "update_DATASOURCESTORAGE (system update)",
                        AnalyticsEvents.UPDATE,
                        datasourceStorage,
                        Map.of(FieldName.IS_DATASOURCE_UPDATE_USER_INVOKED_KEY, false)),
                Arguments.of(
                        "update_DATASOURCESTORAGE (no user-invoked flag)",
                        AnalyticsEvents.UPDATE,
                        datasourceStorage,
                        Map.of()));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("segmentSuppressedObjectEvents")
    void sendObjectEvent_segmentSuppressedEvent_returnsObjectWithoutEnqueueing(
            String description, AnalyticsEvents event, Object object, Map<String, Object> extraProperties) {
        Analytics analytics = mock(Analytics.class);
        AnalyticsServiceCEImpl analyticsService = analyticsService(analytics, loggedInAdmin());

        StepVerifier.create(analyticsService.sendObjectEvent(event, object, extraProperties))
                .expectNext(object)
                .verifyComplete();

        verify(analytics, never()).enqueue(any());
    }

    @Test
    void sendEvent_unitExecutionTime_completesWithoutEnqueueing() {
        Analytics analytics = mock(Analytics.class);
        AnalyticsServiceCEImpl analyticsService = analyticsService(analytics, loggedInAdmin());

        StepVerifier.create(analyticsService.sendEvent(
                        AnalyticsEvents.UNIT_EXECUTION_TIME.getEventName(),
                        "admin@example.com",
                        Map.of("flowName", "import")))
                .verifyComplete();

        verify(analytics, never()).enqueue(any());
    }

    @Test
    void sendObjectEvent_createNewAction_stillEnqueuesOnce() {
        Analytics analytics = mock(Analytics.class);
        AnalyticsServiceCEImpl analyticsService = analyticsService(analytics, loggedInAdmin());

        NewAction action = new NewAction();
        action.setId("action-1");

        StepVerifier.create(analyticsService.sendObjectEvent(AnalyticsEvents.CREATE, action, Map.of()))
                .expectNext(action)
                .verifyComplete();

        assertEquals("create_NEWACTION", enqueuedEventName(analytics));
    }

    @Test
    void sendObjectEvent_userInvokedDatasourceStorageUpdate_stillEnqueuesOnce() {
        Analytics analytics = mock(Analytics.class);
        AnalyticsServiceCEImpl analyticsService = analyticsService(analytics, loggedInAdmin());

        DatasourceStorage datasourceStorage = new DatasourceStorage();
        datasourceStorage.setId("storage-1");

        StepVerifier.create(analyticsService.sendObjectEvent(
                        AnalyticsEvents.UPDATE,
                        datasourceStorage,
                        Map.of(FieldName.IS_DATASOURCE_UPDATE_USER_INVOKED_KEY, true)))
                .expectNext(datasourceStorage)
                .verifyComplete();

        assertEquals("update_DATASOURCESTORAGE", enqueuedEventName(analytics));
    }

    static Stream<Arguments> anonymousObjectEvents() {
        NewPage page = new NewPage();
        page.setId("page-1");
        ActionDTO action = new ActionDTO();
        action.setId("action-1");

        return Stream.of(
                Arguments.of(AnalyticsEvents.VIEW, page), Arguments.of(AnalyticsEvents.EXECUTE_ACTION, action));
    }

    // Anonymous visitors are dropped unconditionally: the block-anonymous-tracking flag is off here, which used to
    // forward page views and action executions with the browser's anonymous id as a billed Segment user.
    @ParameterizedTest
    @MethodSource("anonymousObjectEvents")
    void sendObjectEvent_anonymousSession_returnsObjectWithoutEnqueueingEvenWithBlockFlagOff(
            AnalyticsEvents event, Object object) {
        Analytics analytics = mock(Analytics.class);
        AnalyticsServiceCEImpl analyticsService = analyticsService(analytics, null);

        StepVerifier.create(analyticsService.sendObjectEvent(event, object, Map.of()))
                .expectNext(object)
                .verifyComplete();

        verify(analytics, never()).enqueue(any());
    }

    @Test
    void sendEvent_anonymousUser_completesWithoutEnqueueingEvenWithBlockFlagOff() {
        Analytics analytics = mock(Analytics.class);
        AnalyticsServiceCEImpl analyticsService = analyticsService(analytics, null);

        StepVerifier.create(analyticsService.sendEvent("execute_ACTION_TRIGGERED", FieldName.ANONYMOUS_USER, Map.of()))
                .verifyComplete();

        verify(analytics, never()).enqueue(any());
    }

    private static String enqueuedEventName(Analytics analytics) {
        ArgumentCaptor<MessageBuilder> captor = ArgumentCaptor.forClass(MessageBuilder.class);
        verify(analytics, times(1)).enqueue(captor.capture());
        return ((TrackMessage) captor.getValue().build()).event();
    }

    private static User loggedInAdmin() {
        User admin = new User();
        admin.setEmail("admin@example.com");
        admin.setOrganizationId("org-1");
        return admin;
    }

    /**
     * Stubs are lenient because suppressed paths return before reading most collaborators; a regression then
     * reaches {@code analytics.enqueue} and fails the {@code never()} verification instead of an unrelated NPE.
     *
     * @param sessionUser the logged-in user, or {@code null} for an anonymous session
     */
    private static AnalyticsServiceCEImpl analyticsService(Analytics analytics, User sessionUser) {
        SessionUserService sessionUserService = mock(SessionUserService.class);
        lenient()
                .when(sessionUserService.getCurrentUser())
                .thenReturn(sessionUser == null ? Mono.empty() : Mono.just(sessionUser));

        // Cloud hosting keeps the user id unhashed.
        CommonConfig commonConfig = mock(CommonConfig.class);
        lenient().when(commonConfig.getIsCloudHosting()).thenReturn(true);
        lenient().when(commonConfig.getAdminEmailDomainHash()).thenReturn("admin-domain-hash");

        ConfigService configService = mock(ConfigService.class);
        lenient().when(configService.getInstanceId()).thenReturn(Mono.just("instance-id"));

        ProjectProperties projectProperties = mock(ProjectProperties.class);
        lenient().when(projectProperties.getVersion()).thenReturn("v1.0.0-test");

        FeatureFlagService featureFlagService = mock(FeatureFlagService.class);
        lenient()
                .when(featureFlagService.check(FeatureFlagEnum.configure_block_event_tracking_for_anonymous_users))
                .thenReturn(Mono.just(false));

        return new AnalyticsServiceCEImpl(
                analytics,
                sessionUserService,
                commonConfig,
                configService,
                null, // userUtils
                projectProperties,
                mock(DeploymentProperties.class),
                null, // userDataRepository
                featureFlagService);
    }
}
