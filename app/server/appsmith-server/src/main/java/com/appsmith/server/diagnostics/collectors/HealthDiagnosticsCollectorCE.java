package com.appsmith.server.diagnostics.collectors;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.diagnostics.DiagnosticsValues;
import com.appsmith.server.diagnostics.dtos.DiagnosticsSectionId;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

/**
 * Reports the status of MongoDB, Redis, RTS and MCP, the MongoDB {@code major.minor} version, and, in EE, the license
 * plan and state. All four status checks run in parallel, each with its own 3-second timeout.
 */
@Slf4j
public class HealthDiagnosticsCollectorCE implements DiagnosticsCollector {

    protected static final List<String> EE_KEYS = List.of(
            "licensePlan",
            "licenseStatus",
            "licenseType",
            "licenseOrigin",
            "productEdition",
            "licenseActive",
            "licenseExpiryDate");

    /** The constant names of the EE {@code LicensePlan} enum. CE has no such enum, so they are literals here. */
    protected static final Set<String> LICENSE_PLANS =
            Set.of("FREE", "SELF_SERVE", "ENTERPRISE", "BUSINESS", "BUSINESS_AI");

    /** The constant names of the EE {@code LicenseStatus} enum. */
    protected static final Set<String> LICENSE_STATUSES = Set.of("ACTIVE", "EXPIRED", "IN_GRACE_PERIOD");

    /** The constant names of the EE {@code LicenseType} enum. */
    protected static final Set<String> LICENSE_TYPES = Set.of("TRIAL", "PAID");

    /** The constant names of the EE {@code LicenseOrigin} enum. */
    protected static final Set<String> LICENSE_ORIGINS =
            Set.of("SELF_SERVE", "ENTERPRISE", "AIR_GAP", "SALES", "PARTNERSHIP", "APPSMITH_CLOUD");

    /** The constant names of the EE {@code ProductEdition} enum. */
    protected static final Set<String> PRODUCT_EDITIONS = Set.of("COMMUNITY", "COMMERCIAL", "AIR_GAP");

    private static final Pattern MAJOR_MINOR = Pattern.compile("^(\\d+\\.\\d+)(\\.|$)");

    private static final DiagnosticsSchema SCHEMA = DiagnosticsSchema.builder()
            .category("mongo", DiagnosticsValues.UP, DiagnosticsValues.DOWN)
            .category("redis", DiagnosticsValues.UP, DiagnosticsValues.DOWN)
            .category("rts", DiagnosticsValues.UP, DiagnosticsValues.DOWN)
            .category("mcp", DiagnosticsValues.UP, DiagnosticsValues.DOWN)
            .key("mongoVersion", DiagnosticsSchema.ValueKind.VERSION)
            .category("licensePlan", withOther(LICENSE_PLANS))
            .category("licenseStatus", withOther(LICENSE_STATUSES))
            .category("licenseType", withOther(LICENSE_TYPES))
            .category("licenseOrigin", withOther(LICENSE_ORIGINS))
            .category("productEdition", withOther(PRODUCT_EDITIONS))
            .key("licenseActive", DiagnosticsSchema.ValueKind.BOOLEAN)
            .key("licenseExpiryDate", DiagnosticsSchema.ValueKind.DATE)
            .build();

    private final DiagnosticsHealthIndicators healthIndicators;
    private final DiagnosticsLoopbackProbe loopbackProbe;
    private final CommonConfig commonConfig;

    public HealthDiagnosticsCollectorCE(
            DiagnosticsHealthIndicators healthIndicators,
            DiagnosticsLoopbackProbe loopbackProbe,
            CommonConfig commonConfig) {
        this.healthIndicators = healthIndicators;
        this.loopbackProbe = loopbackProbe;
        this.commonConfig = commonConfig;
    }

    @Override
    public DiagnosticsSectionId sectionId() {
        return DiagnosticsSectionId.HEALTH;
    }

    @Override
    public DiagnosticsSchema schema() {
        return SCHEMA;
    }

    @Override
    public Mono<Map<String, Object>> collect(String organizationId) {
        Mono<Map<String, Object>> ceData = Mono.zip(
                        healthIndicators.mongo(), healthIndicators.redis(), loopbackProbe.rts(), loopbackProbe.mcp())
                .map(statuses -> {
                    Map<String, Object> data = new LinkedHashMap<>();
                    data.put("mongo", statuses.getT1());
                    data.put("redis", statuses.getT2());
                    data.put("rts", statuses.getT3());
                    data.put("mcp", statuses.getT4());
                    data.put("mongoVersion", majorMinor(commonConfig.getMongoDBVersion()));
                    return data;
                });

        // The EE stage starts with the CE checks, so both share the section time limit.
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
                            "Support diagnostics health EE fields failed with {}",
                            error.getClass().getName());
                    return Mono.just(DiagnosticsValues.allWith(EE_KEYS, DiagnosticsValues.UNKNOWN));
                })
                .switchIfEmpty(Mono.fromSupplier(() -> DiagnosticsValues.allWith(EE_KEYS, DiagnosticsValues.UNKNOWN)));
    }

    /** @return the {@code major.minor} part of {@code version}, or {@code UNKNOWN} when it does not start with one. */
    private static String majorMinor(String version) {
        if (version == null) {
            return DiagnosticsValues.UNKNOWN;
        }
        Matcher matcher = MAJOR_MINOR.matcher(version);
        return matcher.find() ? DiagnosticsValues.versionOrUnknown(matcher.group(1)) : DiagnosticsValues.UNKNOWN;
    }

    private static String[] withOther(Set<String> values) {
        return Stream.concat(values.stream(), Stream.of(DiagnosticsValues.OTHER))
                .toArray(String[]::new);
    }
}
