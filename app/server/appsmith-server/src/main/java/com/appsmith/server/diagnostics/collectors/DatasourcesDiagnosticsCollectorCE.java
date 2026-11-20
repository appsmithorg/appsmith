package com.appsmith.server.diagnostics.collectors;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.diagnostics.DiagnosticsValues;
import com.appsmith.server.diagnostics.dtos.DiagnosticsSectionId;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.PluginRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Reports instance-wide counts of datasources, in total and by plugin, and of the datasources that a live action
 * references. Plugins are reported by package name from a fixed list, so a remote plugin lands in {@code other}.
 */
@Slf4j
public class DatasourcesDiagnosticsCollectorCE implements DiagnosticsCollector {

    protected static final List<String> EE_KEYS = List.of("environmentsByType");

    /** The nested keys of {@code environmentsByType}. */
    protected static final Set<String> ENVIRONMENT_BUCKETS = Set.of("production", "staging", "custom");

    private static final DiagnosticsSchema SCHEMA = DiagnosticsSchema.builder()
            .key("datasources", DiagnosticsSchema.ValueKind.COUNT)
            .map("datasourcesByPlugin", DiagnosticsPluginBuckets.bucketKeys())
            .map("referencedDatasourcesByPlugin", DiagnosticsPluginBuckets.bucketKeys())
            .map("environmentsByType", ENVIRONMENT_BUCKETS)
            .build();

    private final DatasourceRepository datasourceRepository;
    private final NewActionRepository newActionRepository;
    private final PluginRepository pluginRepository;

    public DatasourcesDiagnosticsCollectorCE(
            DatasourceRepository datasourceRepository,
            NewActionRepository newActionRepository,
            PluginRepository pluginRepository) {
        this.datasourceRepository = datasourceRepository;
        this.newActionRepository = newActionRepository;
        this.pluginRepository = pluginRepository;
    }

    @Override
    public DiagnosticsSectionId sectionId() {
        return DiagnosticsSectionId.DATASOURCES;
    }

    @Override
    public DiagnosticsSchema schema() {
        return SCHEMA;
    }

    @Override
    public Mono<Map<String, Object>> collect(String organizationId) {
        Mono<Map<String, Long>> referencedByPluginId = newActionRepository
                .findReferencedDatasourceIdsForDiagnostics()
                .flatMap(ids -> ids.isEmpty()
                        ? Mono.just(Map.<String, Long>of())
                        : datasourceRepository.countByPluginIdForDiagnostics(ids));

        Mono<Map<String, Object>> ceData = Mono.zip(
                        datasourceRepository.countByPluginIdForDiagnostics(), referencedByPluginId)
                .flatMap(counts -> packageNames(counts.getT1(), counts.getT2()).map(packageNames -> {
                    Map<String, Object> data = new LinkedHashMap<>();
                    data.put(
                            "datasources",
                            counts.getT1().values().stream()
                                    .mapToLong(Long::longValue)
                                    .sum());
                    data.put("datasourcesByPlugin", byBucket(counts.getT1(), packageNames));
                    data.put("referencedDatasourcesByPlugin", byBucket(counts.getT2(), packageNames));
                    return data;
                }));

        // The EE stage starts with the CE queries, so both share the section time limit.
        return Mono.zip(ceData, eeFieldsOrUnknown(organizationId)).map(parts -> {
            parts.getT1().putAll(parts.getT2());
            return parts.getT1();
        });
    }

    /**
     * The values of the EE-only keys in {@link #EE_KEYS}. CE does not support them.
     */
    protected Mono<Map<String, Object>> eeFields(String organizationId) {
        return Mono.just(DiagnosticsValues.allNotSupported(EE_KEYS));
    }

    /**
     * Calls {@link #eeFields(String)}. An error, a timeout or an empty result reports {@code UNKNOWN} for every EE key
     * and keeps the section.
     */
    private Mono<Map<String, Object>> eeFieldsOrUnknown(String organizationId) {
        return Mono.defer(() -> eeFields(organizationId))
                .timeout(DiagnosticsValues.EE_FIELDS_TIMEOUT)
                .onErrorResume(error -> {
                    log.debug(
                            "Support diagnostics datasources EE fields failed with {}",
                            error.getClass().getName());
                    return Mono.just(DiagnosticsValues.allWith(EE_KEYS, DiagnosticsValues.UNKNOWN));
                })
                .switchIfEmpty(Mono.fromSupplier(() -> DiagnosticsValues.allWith(EE_KEYS, DiagnosticsValues.UNKNOWN)));
    }

    /** Looks up the package name of every plugin in either map with one query. An empty union makes no query. */
    private Mono<Map<String, String>> packageNames(Map<String, Long> datasources, Map<String, Long> referenced) {
        Set<String> pluginIds = new HashSet<>();
        datasources.keySet().stream().filter(StringUtils::hasText).forEach(pluginIds::add);
        referenced.keySet().stream().filter(StringUtils::hasText).forEach(pluginIds::add);
        if (pluginIds.isEmpty()) {
            return Mono.just(Map.of());
        }
        return pluginRepository
                .findAllByIdsWithoutPermission(
                        pluginIds, List.of(Plugin.Fields.packageName, BaseDomain.Fields.policyMap))
                .collect(HashMap::new, (names, plugin) -> names.put(plugin.getId(), plugin.getPackageName()));
    }

    /** Folds counts into every bucket key, in key order, with zero for a bucket that has no datasource. */
    private static Map<String, Object> byBucket(Map<String, Long> countsByPluginId, Map<String, String> packageNames) {
        Map<String, Long> folded = DiagnosticsPluginBuckets.foldByBucket(countsByPluginId, packageNames);
        Map<String, Object> result = new LinkedHashMap<>();
        for (String key : DiagnosticsPluginBuckets.bucketKeys()) {
            result.put(key, folded.getOrDefault(key, 0L));
        }
        return result;
    }
}
