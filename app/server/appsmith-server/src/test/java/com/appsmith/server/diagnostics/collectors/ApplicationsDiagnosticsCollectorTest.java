package com.appsmith.server.diagnostics.collectors;

import com.appsmith.server.diagnostics.DiagnosticsRedactionGuard;
import com.appsmith.server.diagnostics.DiagnosticsValues;
import com.appsmith.server.dtos.ApplicationDiagnosticsCounts;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Duration;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ApplicationsDiagnosticsCollectorTest {

    @Mock
    private WorkspaceRepository workspaceRepository;

    @Mock
    private ApplicationRepository applicationRepository;

    @Mock
    private NewPageRepository newPageRepository;

    @Mock
    private NewActionRepository newActionRepository;

    @Mock
    private ActionCollectionRepository actionCollectionRepository;

    private ApplicationsDiagnosticsCollectorCE collector;

    private final DiagnosticsRedactionGuard guard = new DiagnosticsRedactionGuard(new ObjectMapper());

    @BeforeEach
    void setUp() {
        collector = new ApplicationsDiagnosticsCollectorCE(
                workspaceRepository,
                applicationRepository,
                newPageRepository,
                newActionRepository,
                actionCollectionRepository);
    }

    private void stubRepositories(Document... actionGroups) {
        when(workspaceRepository.countForDiagnostics()).thenReturn(Mono.just(4L));
        when(applicationRepository.countForDiagnostics())
                .thenReturn(Mono.just(new ApplicationDiagnosticsCounts(10, 6, 4, 3, 7)));
        when(newPageRepository.countEditableForDiagnostics()).thenReturn(Mono.just(25L));
        when(newActionRepository.countEditableByPluginTypeForDiagnostics()).thenReturn(Flux.just(actionGroups));
        when(actionCollectionRepository.countEditableForDiagnostics()).thenReturn(Mono.just(5L));
    }

    private static Document group(Object pluginType, int count) {
        return new Document("_id", pluginType).append("count", count);
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> actionsByPluginType(Map<String, Object> data) {
        return (Map<String, Object>) data.get("actionsByPluginType");
    }

    @Test
    void should_reportAllCounts_when_repositoriesReturn() {
        // Given
        stubRepositories(group("DB", 8), group("API", 2));

        // When
        Mono<Map<String, Object>> result = collector.collect("org-1");

        // Then
        StepVerifier.create(result)
                .assertNext(data -> {
                    assertThat(data)
                            .containsEntry("workspaces", 4L)
                            .containsEntry("applications", 10L)
                            .containsEntry("publishedApplications", 6L)
                            .containsEntry("draftApplications", 4L)
                            .containsEntry("gitConnectedApplications", 3L)
                            .containsEntry("gitBranchDocuments", 7L)
                            .containsEntry("pages", 25L)
                            .containsEntry("actions", 10L)
                            .containsEntry("jsFunctions", 0L)
                            .containsEntry("jsObjects", 5L)
                            .containsEntry("countsIncludeGitBranches", true);
                    assertThat(actionsByPluginType(data))
                            .containsEntry("DB", 8L)
                            .containsEntry("API", 2L)
                            .containsEntry("SAAS", 0L)
                            .containsEntry(DiagnosticsValues.UNKNOWN, 0L)
                            .containsEntry(DiagnosticsValues.OTHER, 0L);
                })
                .verifyComplete();
    }

    @Test
    void should_reportNotSupported_when_eeKeysInCe() {
        // Given
        stubRepositories();

        // When
        Mono<Map<String, Object>> result = collector.collect("org-1");

        // Then
        StepVerifier.create(result)
                .assertNext(data -> assertThat(data)
                        .containsEntry("packages", DiagnosticsValues.NOT_SUPPORTED)
                        .containsEntry("publishedPackageVersions", DiagnosticsValues.NOT_SUPPORTED)
                        .containsEntry("modulesByType", DiagnosticsValues.NOT_SUPPORTED))
                .verifyComplete();
    }

    private ApplicationsDiagnosticsCollectorCE withEeFields(Mono<Map<String, Object>> eeFields) {
        return new ApplicationsDiagnosticsCollectorCE(
                workspaceRepository,
                applicationRepository,
                newPageRepository,
                newActionRepository,
                actionCollectionRepository) {
            @Override
            protected Mono<Map<String, Object>> eeFields(String organizationId) {
                return eeFields;
            }
        };
    }

    @Test
    void should_keepCeCountsAndReportUnknownEeKeys_when_eeFieldsNeverCompletes() {
        // Given
        stubRepositories(group("DB", 8));
        ApplicationsDiagnosticsCollectorCE neverEe = withEeFields(Mono.never());

        // When
        StepVerifier.Step<Map<String, Object>> verifier =
                StepVerifier.withVirtualTime(() -> neverEe.collect("org-1")).expectSubscription();

        // Then
        verifier.expectNoEvent(DiagnosticsValues.EE_FIELDS_TIMEOUT.minusMillis(1))
                .thenAwait(Duration.ofMillis(1))
                .assertNext(data -> {
                    assertThat(data)
                            .containsEntry("workspaces", 4L)
                            .containsEntry("actions", 8L)
                            .containsEntry("jsObjects", 5L);
                    assertThat(data.keySet())
                            .endsWith(ApplicationsDiagnosticsCollectorCE.EE_KEYS.toArray(String[]::new));
                    for (String key : ApplicationsDiagnosticsCollectorCE.EE_KEYS) {
                        assertThat(data).containsEntry(key, DiagnosticsValues.UNKNOWN);
                    }
                })
                .expectComplete()
                .verify(Duration.ofSeconds(5));
    }

    @Test
    void should_emitAtEeTimeout_when_ceIsSlowAndEeFieldsNeverCompletes() {
        // Given
        stubRepositories(group("DB", 8));
        when(workspaceRepository.countForDiagnostics())
                .thenAnswer(invocation -> Mono.delay(Duration.ofSeconds(5)).thenReturn(4L));
        ApplicationsDiagnosticsCollectorCE neverEe = withEeFields(Mono.never());

        // When
        StepVerifier.Step<Map<String, Object>> verifier =
                StepVerifier.withVirtualTime(() -> neverEe.collect("org-1")).expectSubscription();

        // Then
        verifier.expectNoEvent(DiagnosticsValues.EE_FIELDS_TIMEOUT.minusMillis(1))
                .thenAwait(Duration.ofMillis(1))
                .assertNext(data -> {
                    assertThat(data).containsEntry("workspaces", 4L).containsEntry("actions", 8L);
                    for (String key : ApplicationsDiagnosticsCollectorCE.EE_KEYS) {
                        assertThat(data).containsEntry(key, DiagnosticsValues.UNKNOWN);
                    }
                })
                .expectComplete()
                .verify(Duration.ofSeconds(5));
    }

    @Test
    void should_reportUnknownEeKeys_when_eeFieldsIsEmpty() {
        // Given
        stubRepositories(group("DB", 8));
        ApplicationsDiagnosticsCollectorCE emptyEe = withEeFields(Mono.empty());

        // When
        Mono<Map<String, Object>> result = emptyEe.collect("org-1");

        // Then
        StepVerifier.create(result)
                .assertNext(data -> {
                    assertThat(data).containsEntry("workspaces", 4L);
                    for (String key : ApplicationsDiagnosticsCollectorCE.EE_KEYS) {
                        assertThat(data).containsEntry(key, DiagnosticsValues.UNKNOWN);
                    }
                })
                .expectComplete()
                .verify(Duration.ofSeconds(5));
    }

    @Test
    void should_keepCeCountsAndReportUnknownEeKeys_when_eeFieldsFails() {
        // Given
        stubRepositories(group("DB", 8));
        ApplicationsDiagnosticsCollectorCE failingEe =
                new ApplicationsDiagnosticsCollectorCE(
                        workspaceRepository,
                        applicationRepository,
                        newPageRepository,
                        newActionRepository,
                        actionCollectionRepository) {
                    @Override
                    protected Mono<Map<String, Object>> eeFields(String organizationId) {
                        return Mono.error(new IllegalStateException("feature lookup failed"));
                    }
                };

        // When
        Mono<Map<String, Object>> result = failingEe.collect("org-1");

        // Then
        StepVerifier.create(result)
                .assertNext(data -> {
                    assertThat(data)
                            .containsEntry("workspaces", 4L)
                            .containsEntry("applications", 10L)
                            .containsEntry("pages", 25L)
                            .containsEntry("actions", 8L)
                            .containsEntry("jsObjects", 5L)
                            .containsEntry("packages", DiagnosticsValues.UNKNOWN)
                            .containsEntry("publishedPackageVersions", DiagnosticsValues.UNKNOWN)
                            .containsEntry("modulesByType", DiagnosticsValues.UNKNOWN);
                    assertThat(guard.violation(failingEe.schema(), data)).isEmpty();
                })
                .verifyComplete();
    }

    @Test
    void should_excludeJsFromActions_when_jsPresent() {
        // Given
        stubRepositories(group("DB", 3), group("JS", 9));

        // When
        Mono<Map<String, Object>> result = collector.collect("org-1");

        // Then
        StepVerifier.create(result)
                .assertNext(data -> {
                    assertThat(data).containsEntry("actions", 3L).containsEntry("jsFunctions", 9L);
                    assertThat(actionsByPluginType(data)).doesNotContainKey("JS");
                })
                .verifyComplete();
    }

    @Test
    void should_mapUnknownPluginType_when_typeNotInEnum() {
        // Given
        stubRepositories(group("LEGACY_REMOVED_TYPE", 2), group("ANOTHER_REMOVED_TYPE", 1), group(null, 4));

        // When
        Mono<Map<String, Object>> result = collector.collect("org-1");

        // Then
        StepVerifier.create(result)
                .assertNext(data -> {
                    assertThat(actionsByPluginType(data))
                            .containsEntry(DiagnosticsValues.OTHER, 3L)
                            .containsEntry(DiagnosticsValues.UNKNOWN, 4L)
                            .doesNotContainKeys("LEGACY_REMOVED_TYPE", "ANOTHER_REMOVED_TYPE");
                    assertThat(data).containsEntry("actions", 7L);
                })
                .verifyComplete();
    }

    @Test
    void should_passTheRedactionGuard_when_collected() {
        // Given
        stubRepositories(group("DB", 3), group("JS", 1), group("LEGACY_REMOVED_TYPE", 2), group(null, 1));

        // When
        Mono<Map<String, Object>> result = collector.collect("org-1");

        // Then
        StepVerifier.create(result)
                .assertNext(data ->
                        assertThat(guard.violation(collector.schema(), data)).isEmpty())
                .verifyComplete();
    }
}
