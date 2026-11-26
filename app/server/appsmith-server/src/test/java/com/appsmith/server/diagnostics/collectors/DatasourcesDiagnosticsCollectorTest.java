package com.appsmith.server.diagnostics.collectors;

import com.appsmith.server.diagnostics.DiagnosticsRedactionGuard;
import com.appsmith.server.diagnostics.DiagnosticsValues;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DatasourcesDiagnosticsCollectorTest {

    @Mock
    private DatasourceRepository datasourceRepository;

    @Mock
    private NewActionRepository newActionRepository;

    @Mock
    private PluginRepository pluginRepository;

    private DatasourcesDiagnosticsCollectorCE collector;

    private final DiagnosticsRedactionGuard guard = new DiagnosticsRedactionGuard(new ObjectMapper());

    @BeforeEach
    void setUp() {
        collector = new DatasourcesDiagnosticsCollectorCE(datasourceRepository, newActionRepository, pluginRepository);
    }

    private static Plugin plugin(String id, String packageName) {
        Plugin plugin = new Plugin();
        plugin.setId(id);
        plugin.setPackageName(packageName);
        return plugin;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> nested(Map<String, Object> data, String key) {
        return (Map<String, Object>) data.get(key);
    }

    @Test
    void should_bucketUnknownPlugins_when_remotePluginPresent() {
        // Given
        when(datasourceRepository.countByPluginIdForDiagnostics())
                .thenReturn(Mono.just(Map.of("p-pg", 3L, "p-remote", 2L, "p-gone", 1L, "", 1L)));
        when(newActionRepository.findReferencedDatasourceIdsForDiagnostics()).thenReturn(Mono.just(Set.of()));
        when(pluginRepository.findAllByIdsWithoutPermission(any(), any()))
                .thenReturn(Flux.just(plugin("p-pg", "postgres-plugin"), plugin("p-remote", "custom-remote-plugin")));

        // When
        Mono<Map<String, Object>> result = collector.collect("org-1");

        // Then
        StepVerifier.create(result)
                .assertNext(data -> {
                    assertThat(data).containsEntry("datasources", 7L);
                    assertThat(nested(data, "datasourcesByPlugin"))
                            .containsEntry("postgres-plugin", 3L)
                            .containsEntry("mysql-plugin", 0L)
                            .containsEntry(DiagnosticsValues.OTHER, 4L)
                            .doesNotContainKey("custom-remote-plugin");
                    assertThat(nested(data, "datasourcesByPlugin").keySet())
                            .containsExactlyElementsOf(DiagnosticsPluginBuckets.bucketKeys());
                })
                .verifyComplete();
        verify(pluginRepository)
                .findAllByIdsWithoutPermission(
                        Set.of("p-pg", "p-remote", "p-gone"), List.of("packageName", "policyMap"));
    }

    private DatasourcesDiagnosticsCollectorCE withEeFields(Mono<Map<String, Object>> eeFields) {
        return new DatasourcesDiagnosticsCollectorCE(datasourceRepository, newActionRepository, pluginRepository) {
            @Override
            protected Mono<Map<String, Object>> eeFields(String organizationId) {
                return eeFields;
            }
        };
    }

    private void stubOnePlugin() {
        when(datasourceRepository.countByPluginIdForDiagnostics()).thenReturn(Mono.just(Map.of("p-pg", 3L)));
        when(newActionRepository.findReferencedDatasourceIdsForDiagnostics()).thenReturn(Mono.just(Set.of()));
        when(pluginRepository.findAllByIdsWithoutPermission(any(), any()))
                .thenReturn(Flux.just(plugin("p-pg", "postgres-plugin")));
    }

    @Test
    void should_keepCeCountsAndReportUnknownEeKeys_when_eeFieldsNeverCompletes() {
        // Given
        stubOnePlugin();
        DatasourcesDiagnosticsCollectorCE neverEe = withEeFields(Mono.never());

        // When
        StepVerifier.Step<Map<String, Object>> verifier =
                StepVerifier.withVirtualTime(() -> neverEe.collect("org-1")).expectSubscription();

        // Then
        verifier.expectNoEvent(DiagnosticsValues.EE_FIELDS_TIMEOUT.minusMillis(1))
                .thenAwait(Duration.ofMillis(1))
                .assertNext(data -> {
                    assertThat(data).containsEntry("datasources", 3L);
                    assertThat(nested(data, "datasourcesByPlugin")).containsEntry("postgres-plugin", 3L);
                    assertThat(data.keySet())
                            .endsWith(DatasourcesDiagnosticsCollectorCE.EE_KEYS.toArray(String[]::new));
                    for (String key : DatasourcesDiagnosticsCollectorCE.EE_KEYS) {
                        assertThat(data).containsEntry(key, DiagnosticsValues.UNKNOWN);
                    }
                })
                .expectComplete()
                .verify(Duration.ofSeconds(5));
    }

    @Test
    void should_emitAtEeTimeout_when_ceIsSlowAndEeFieldsNeverCompletes() {
        // Given
        stubOnePlugin();
        when(datasourceRepository.countByPluginIdForDiagnostics())
                .thenAnswer(invocation -> Mono.delay(Duration.ofSeconds(5)).thenReturn(Map.of("p-pg", 3L)));
        DatasourcesDiagnosticsCollectorCE neverEe = withEeFields(Mono.never());

        // When
        StepVerifier.Step<Map<String, Object>> verifier =
                StepVerifier.withVirtualTime(() -> neverEe.collect("org-1")).expectSubscription();

        // Then
        verifier.expectNoEvent(DiagnosticsValues.EE_FIELDS_TIMEOUT.minusMillis(1))
                .thenAwait(Duration.ofMillis(1))
                .assertNext(data -> {
                    assertThat(data).containsEntry("datasources", 3L);
                    for (String key : DatasourcesDiagnosticsCollectorCE.EE_KEYS) {
                        assertThat(data).containsEntry(key, DiagnosticsValues.UNKNOWN);
                    }
                })
                .expectComplete()
                .verify(Duration.ofSeconds(5));
    }

    @Test
    void should_reportUnknownEeKeys_when_eeFieldsIsEmpty() {
        // Given
        stubOnePlugin();
        DatasourcesDiagnosticsCollectorCE emptyEe = withEeFields(Mono.empty());

        // When
        Mono<Map<String, Object>> result = emptyEe.collect("org-1");

        // Then
        StepVerifier.create(result)
                .assertNext(data -> {
                    assertThat(data).containsEntry("datasources", 3L);
                    for (String key : DatasourcesDiagnosticsCollectorCE.EE_KEYS) {
                        assertThat(data).containsEntry(key, DiagnosticsValues.UNKNOWN);
                    }
                })
                .expectComplete()
                .verify(Duration.ofSeconds(5));
    }

    @Test
    void should_keepCeCountsAndReportUnknownEeKeys_when_eeFieldsFails() {
        // Given
        when(datasourceRepository.countByPluginIdForDiagnostics()).thenReturn(Mono.just(Map.of("p-pg", 3L)));
        when(newActionRepository.findReferencedDatasourceIdsForDiagnostics()).thenReturn(Mono.just(Set.of()));
        when(pluginRepository.findAllByIdsWithoutPermission(any(), any()))
                .thenReturn(Flux.just(plugin("p-pg", "postgres-plugin")));
        DatasourcesDiagnosticsCollectorCE failingEe =
                new DatasourcesDiagnosticsCollectorCE(datasourceRepository, newActionRepository, pluginRepository) {
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
                            .containsEntry("datasources", 3L)
                            .containsEntry("environmentsByType", DiagnosticsValues.UNKNOWN);
                    assertThat(nested(data, "datasourcesByPlugin")).containsEntry("postgres-plugin", 3L);
                    assertThat(guard.violation(failingEe.schema(), data)).isEmpty();
                })
                .verifyComplete();
    }

    @Test
    void should_reportReferencedCounts_when_referencedIdsPresent() {
        // Given
        when(datasourceRepository.countByPluginIdForDiagnostics())
                .thenReturn(Mono.just(Map.of("p-pg", 3L, "p-my", 1L)));
        when(newActionRepository.findReferencedDatasourceIdsForDiagnostics())
                .thenReturn(Mono.just(Set.of("ds-1", "ds-2")));
        when(datasourceRepository.countByPluginIdForDiagnostics(Set.of("ds-1", "ds-2")))
                .thenReturn(Mono.just(Map.of("p-pg", 2L)));
        when(pluginRepository.findAllByIdsWithoutPermission(any(), any()))
                .thenReturn(Flux.just(plugin("p-pg", "postgres-plugin"), plugin("p-my", "mysql-plugin")));

        // When
        Mono<Map<String, Object>> result = collector.collect("org-1");

        // Then
        StepVerifier.create(result)
                .assertNext(data -> {
                    assertThat(nested(data, "referencedDatasourcesByPlugin"))
                            .containsEntry("postgres-plugin", 2L)
                            .containsEntry("mysql-plugin", 0L);
                    assertThat(nested(data, "datasourcesByPlugin"))
                            .containsEntry("postgres-plugin", 3L)
                            .containsEntry("mysql-plugin", 1L);
                })
                .verifyComplete();
        verify(pluginRepository)
                .findAllByIdsWithoutPermission(Set.of("p-pg", "p-my"), List.of("packageName", "policyMap"));
    }

    @Test
    void should_notQueryReferences_when_noReferencedIds() {
        // Given
        when(datasourceRepository.countByPluginIdForDiagnostics()).thenReturn(Mono.just(Map.of()));
        when(newActionRepository.findReferencedDatasourceIdsForDiagnostics()).thenReturn(Mono.just(Set.of()));

        // When
        Mono<Map<String, Object>> result = collector.collect("org-1");

        // Then
        StepVerifier.create(result)
                .assertNext(data -> {
                    assertThat(data).containsEntry("datasources", 0L);
                    assertThat(nested(data, "referencedDatasourcesByPlugin").values())
                            .containsOnly(0L);
                })
                .verifyComplete();
        verify(datasourceRepository, never()).countByPluginIdForDiagnostics(any(Set.class));
        verifyNoInteractions(pluginRepository);
    }

    @Test
    void should_reportNotSupported_when_ce() {
        // Given
        when(datasourceRepository.countByPluginIdForDiagnostics()).thenReturn(Mono.just(Map.of()));
        when(newActionRepository.findReferencedDatasourceIdsForDiagnostics()).thenReturn(Mono.just(Set.of()));

        // When
        Mono<Map<String, Object>> result = collector.collect("org-1");

        // Then
        StepVerifier.create(result)
                .assertNext(
                        data -> assertThat(data).containsEntry("environmentsByType", DiagnosticsValues.NOT_SUPPORTED))
                .verifyComplete();
    }

    @Test
    void should_passTheRedactionGuard_when_collected() {
        // Given
        when(datasourceRepository.countByPluginIdForDiagnostics())
                .thenReturn(Mono.just(Map.of("p-pg", 3L, "p-remote", 2L)));
        when(newActionRepository.findReferencedDatasourceIdsForDiagnostics()).thenReturn(Mono.just(Set.of("ds-1")));
        when(datasourceRepository.countByPluginIdForDiagnostics(Set.of("ds-1")))
                .thenReturn(Mono.just(Map.of("p-remote", 1L)));
        when(pluginRepository.findAllByIdsWithoutPermission(any(), any()))
                .thenReturn(Flux.just(plugin("p-pg", "postgres-plugin"), plugin("p-remote", "secret-host-plugin")));

        // When
        Mono<Map<String, Object>> result = collector.collect("org-1");

        // Then
        StepVerifier.create(result)
                .assertNext(data ->
                        assertThat(guard.violation(collector.schema(), data)).isEmpty())
                .verifyComplete();
    }
}
