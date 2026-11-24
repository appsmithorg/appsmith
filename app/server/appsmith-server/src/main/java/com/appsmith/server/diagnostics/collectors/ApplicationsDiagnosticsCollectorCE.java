package com.appsmith.server.diagnostics.collectors;

import com.appsmith.external.models.PluginType;
import com.appsmith.server.diagnostics.DiagnosticsValues;
import com.appsmith.server.diagnostics.dtos.DiagnosticsSectionId;
import com.appsmith.server.dtos.ApplicationDiagnosticsCounts;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import org.bson.Document;
import reactor.core.publisher.Mono;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;

/**
 * Reports instance-wide counts of workspaces, applications, pages, actions and JS objects. Page, action and JS object
 * counts include Git branch documents. Each count is one query or one aggregation, without ACL.
 */
public class ApplicationsDiagnosticsCollectorCE implements DiagnosticsCollector {

    protected static final List<String> EE_KEYS = List.of("packages", "publishedPackageVersions", "modulesByType");

    private static final String JS = PluginType.JS.name();

    /** The {@code PluginType} names except {@code JS}, in enum order, then UNKNOWN and other. */
    private static final List<String> ACTION_KEYS = Stream.concat(
                    Arrays.stream(PluginType.values()).map(PluginType::name).filter(name -> !JS.equals(name)),
                    Stream.of(DiagnosticsValues.UNKNOWN, DiagnosticsValues.OTHER))
            .toList();

    private static final DiagnosticsSchema SCHEMA = DiagnosticsSchema.builder()
            .key("workspaces", DiagnosticsSchema.ValueKind.COUNT)
            .key("applications", DiagnosticsSchema.ValueKind.COUNT)
            .key("publishedApplications", DiagnosticsSchema.ValueKind.COUNT)
            .key("draftApplications", DiagnosticsSchema.ValueKind.COUNT)
            .key("gitConnectedApplications", DiagnosticsSchema.ValueKind.COUNT)
            .key("gitBranchDocuments", DiagnosticsSchema.ValueKind.COUNT)
            .key("pages", DiagnosticsSchema.ValueKind.COUNT)
            .key("actions", DiagnosticsSchema.ValueKind.COUNT)
            .map("actionsByPluginType", Set.copyOf(ACTION_KEYS))
            .key("jsFunctions", DiagnosticsSchema.ValueKind.COUNT)
            .key("jsObjects", DiagnosticsSchema.ValueKind.COUNT)
            .key("countsIncludeGitBranches", DiagnosticsSchema.ValueKind.BOOLEAN)
            .key("packages", DiagnosticsSchema.ValueKind.COUNT)
            .key("publishedPackageVersions", DiagnosticsSchema.ValueKind.COUNT)
            // The ModuleType names. CE has no ModuleType, so they are literals; the EE test checks them against it.
            .map("modulesByType", Set.of("QUERY_MODULE", "JS_MODULE", "UI_MODULE", DiagnosticsValues.OTHER))
            .build();

    private final WorkspaceRepository workspaceRepository;
    private final ApplicationRepository applicationRepository;
    private final NewPageRepository newPageRepository;
    private final NewActionRepository newActionRepository;
    private final ActionCollectionRepository actionCollectionRepository;

    public ApplicationsDiagnosticsCollectorCE(
            WorkspaceRepository workspaceRepository,
            ApplicationRepository applicationRepository,
            NewPageRepository newPageRepository,
            NewActionRepository newActionRepository,
            ActionCollectionRepository actionCollectionRepository) {
        this.workspaceRepository = workspaceRepository;
        this.applicationRepository = applicationRepository;
        this.newPageRepository = newPageRepository;
        this.newActionRepository = newActionRepository;
        this.actionCollectionRepository = actionCollectionRepository;
    }

    @Override
    public DiagnosticsSectionId sectionId() {
        return DiagnosticsSectionId.APPLICATIONS;
    }

    @Override
    public DiagnosticsSchema schema() {
        return SCHEMA;
    }

    @Override
    public Mono<Map<String, Object>> collect(String organizationId) {
        Mono<Map<String, Long>> actionCounts = newActionRepository
                .countEditableByPluginTypeForDiagnostics()
                .reduceWith(LinkedHashMap::new, ApplicationsDiagnosticsCollectorCE::addActionGroup);

        Mono<Map<String, Object>> ceData = Mono.zip(
                        workspaceRepository.countForDiagnostics(),
                        applicationRepository.countForDiagnostics(),
                        newPageRepository.countEditableForDiagnostics(),
                        actionCounts,
                        actionCollectionRepository.countEditableForDiagnostics())
                .map(counts -> {
                    ApplicationDiagnosticsCounts applications = counts.getT2();
                    Map<String, Long> byType = counts.getT4();

                    Map<String, Object> actionsByPluginType = new LinkedHashMap<>();
                    long actions = 0;
                    for (String key : ACTION_KEYS) {
                        long count = byType.getOrDefault(key, 0L);
                        actionsByPluginType.put(key, count);
                        actions += count;
                    }

                    Map<String, Object> data = new LinkedHashMap<>();
                    data.put("workspaces", counts.getT1());
                    data.put("applications", applications.applications());
                    data.put("publishedApplications", applications.published());
                    data.put("draftApplications", applications.draft());
                    data.put("gitConnectedApplications", applications.gitConnected());
                    data.put("gitBranchDocuments", applications.gitBranchDocuments());
                    data.put("pages", counts.getT3());
                    data.put("actions", actions);
                    data.put("actionsByPluginType", actionsByPluginType);
                    data.put("jsFunctions", byType.getOrDefault(JS, 0L));
                    data.put("jsObjects", counts.getT5());
                    data.put("countsIncludeGitBranches", true);

                    return data;
                });

        // The EE stage starts with the CE queries, so both share the section time limit.
        return DiagnosticsEeFields.merge(ceData, () -> eeFields(organizationId), EE_KEYS, "applications");
    }

    /**
     * The values of the EE-only keys in {@link #EE_KEYS}. CE does not support them.
     */
    protected Mono<Map<String, Object>> eeFields(String organizationId) {
        return Mono.just(DiagnosticsValues.allNotSupported(EE_KEYS));
    }

    private static Map<String, Long> addActionGroup(Map<String, Long> totals, Document group) {
        totals.merge(pluginTypeKey(group.get("_id")), ((Number) group.get("count")).longValue(), Long::sum);
        return totals;
    }

    /** Maps a stored plugin type to a fixed key: null gives UNKNOWN, a name outside the enum gives other. */
    private static String pluginTypeKey(Object storedType) {
        if (storedType == null) {
            return DiagnosticsValues.UNKNOWN;
        }
        try {
            return PluginType.valueOf(storedType.toString()).name();
        } catch (IllegalArgumentException e) {
            return DiagnosticsValues.OTHER;
        }
    }
}
