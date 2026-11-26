package com.appsmith.server.diagnostics.collectors;

import com.appsmith.external.enums.FeatureFlagEnum;
import com.appsmith.server.diagnostics.DiagnosticsValues;
import com.appsmith.server.diagnostics.dtos.DiagnosticsSectionId;
import com.appsmith.server.services.FeatureFlagService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Reports the organization-level feature flags. Only names from {@link FeatureFlagEnum} are reported, so a flag
 * name that comes from the license server never reaches the result. It makes no user-level call. On a cold
 * organization cache the read can trigger one remote refresh. If that refresh fails before the section timeout, the
 * flags report {@code UNKNOWN}. If the section timeout expires first, the section reports {@code UNAVAILABLE} with
 * {@code timeout}.
 */
@Component
@RequiredArgsConstructor
public class FeatureFlagsDiagnosticsCollector implements DiagnosticsCollector {

    private static final Set<FeatureFlagEnum> TEST_FLAGS = Set.of(
            FeatureFlagEnum.TEST_FEATURE_1,
            FeatureFlagEnum.TEST_FEATURE_2,
            FeatureFlagEnum.TEST_FEATURE_3,
            FeatureFlagEnum.ORGANIZATION_TEST_FEATURE);

    private static final List<String> REPORTED_FLAGS = Arrays.stream(FeatureFlagEnum.values())
            .filter(flag -> !TEST_FLAGS.contains(flag))
            .map(FeatureFlagEnum::name)
            .toList();

    private static final DiagnosticsSchema SCHEMA = DiagnosticsSchema.builder()
            .category("source", "organization")
            .key("knownFlagCount", DiagnosticsSchema.ValueKind.COUNT)
            .map("flags", REPORTED_FLAGS.stream().collect(Collectors.toUnmodifiableSet()))
            .build();

    private final FeatureFlagService featureFlagService;

    @Override
    public DiagnosticsSectionId sectionId() {
        return DiagnosticsSectionId.FEATURE_FLAGS;
    }

    @Override
    public DiagnosticsSchema schema() {
        return SCHEMA;
    }

    @Override
    public Mono<Map<String, Object>> collect(String organizationId) {
        return featureFlagService.getOrganizationFeatures(organizationId).map(orgFlags -> {
            Map<String, Object> flags = new LinkedHashMap<>();
            for (String name : REPORTED_FLAGS) {
                Boolean value = orgFlags.get(name);
                flags.put(name, value == null ? DiagnosticsValues.UNKNOWN : value);
            }
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("source", "organization");
            data.put("knownFlagCount", REPORTED_FLAGS.size());
            data.put("flags", flags);
            return data;
        });
    }
}
