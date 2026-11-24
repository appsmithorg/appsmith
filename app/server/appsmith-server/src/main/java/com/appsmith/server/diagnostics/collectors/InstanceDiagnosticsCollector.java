package com.appsmith.server.diagnostics.collectors;

import com.appsmith.server.configurations.DeploymentProperties;
import com.appsmith.server.configurations.ProjectProperties;
import com.appsmith.server.diagnostics.DiagnosticsValues;
import com.appsmith.server.diagnostics.collectors.DiagnosticsSchema.ValueKind;
import com.appsmith.server.diagnostics.dtos.DiagnosticsSectionId;
import com.appsmith.server.services.ConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import java.lang.management.ManagementFactory;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

/** Reports the Instance and runtime section: edition, version, instance ID, uptime, JVM and OS. */
@Slf4j
@Component
@RequiredArgsConstructor
public class InstanceDiagnosticsCollector implements DiagnosticsCollector {

    private static final Set<String> EDITIONS = Set.of("CE", "EE");

    private static final DiagnosticsSchema SCHEMA = DiagnosticsSchema.builder()
            .category("edition", "CE", "EE", DiagnosticsValues.OTHER)
            .key("version", ValueKind.VERSION)
            .key("instanceId", ValueKind.INSTANCE_ID)
            .key("commitSha", ValueKind.COMMIT_SHA)
            .key("configuredPublicUrl", ValueKind.FREE_TEXT)
            .key("uptimeSeconds", ValueKind.COUNT)
            .key("javaVersion", ValueKind.VERSION)
            .category("osName", "linux", "macos", "windows", DiagnosticsValues.OTHER)
            .category("osArch", "amd64", "arm64", DiagnosticsValues.OTHER)
            .build();

    private final DeploymentProperties deploymentProperties;
    private final ProjectProperties projectProperties;
    private final ConfigService configService;

    @Override
    public DiagnosticsSectionId sectionId() {
        return DiagnosticsSectionId.INSTANCE;
    }

    @Override
    public DiagnosticsSchema schema() {
        return SCHEMA;
    }

    @Override
    public Mono<Map<String, Object>> collect(String organizationId) {
        return Mono.defer(configService::getInstanceId)
                .onErrorResume(error -> {
                    log.debug(
                            "Support diagnostics instance ID lookup failed with {}",
                            error.getClass().getName());
                    return Mono.empty();
                })
                .defaultIfEmpty(DiagnosticsValues.UNKNOWN)
                .map(instanceId -> {
                    Map<String, Object> data = new LinkedHashMap<>();
                    data.put("edition", edition(deploymentProperties.getEdition()));
                    data.put("version", version(projectProperties.getVersion()));
                    data.put("commitSha", DiagnosticsValues.commitShaOrUnknown(projectProperties.getCommitSha()));
                    data.put("instanceId", orUnknown(instanceId));
                    data.put("configuredPublicUrl", DiagnosticsValues.UNKNOWN);
                    data.put(
                            "uptimeSeconds",
                            ManagementFactory.getRuntimeMXBean().getUptime() / 1000);
                    data.put("javaVersion", DiagnosticsValues.versionOrUnknown(System.getProperty("java.version")));
                    data.put("osName", normalizeOsName(System.getProperty("os.name")));
                    data.put("osArch", normalizeOsArch(System.getProperty("os.arch")));
                    return data;
                });
    }

    static String normalizeOsName(String name) {
        if (!StringUtils.hasText(name)) {
            return DiagnosticsValues.UNKNOWN;
        }
        if (name.startsWith("Linux")) {
            return "linux";
        }
        if (name.startsWith("Mac")) {
            return "macos";
        }
        if (name.startsWith("Windows")) {
            return "windows";
        }
        return DiagnosticsValues.OTHER;
    }

    static String normalizeOsArch(String arch) {
        if (!StringUtils.hasText(arch)) {
            return DiagnosticsValues.UNKNOWN;
        }
        return switch (arch) {
            case "amd64", "x86_64" -> "amd64";
            case "aarch64", "arm64" -> "arm64";
            default -> DiagnosticsValues.OTHER;
        };
    }

    private static String orUnknown(String value) {
        return StringUtils.hasText(value) ? value : DiagnosticsValues.UNKNOWN;
    }

    private static String edition(String value) {
        if (!StringUtils.hasText(value)) {
            return DiagnosticsValues.UNKNOWN;
        }
        return EDITIONS.contains(value) ? value : DiagnosticsValues.OTHER;
    }

    /** A leading {@code v} is dropped, so a tag such as {@code v1.9.30} reports as {@code 1.9.30}. */
    private static String version(String value) {
        if (value != null && (value.startsWith("v") || value.startsWith("V"))) {
            return DiagnosticsValues.versionOrUnknown(value.substring(1));
        }
        return DiagnosticsValues.versionOrUnknown(value);
    }
}
