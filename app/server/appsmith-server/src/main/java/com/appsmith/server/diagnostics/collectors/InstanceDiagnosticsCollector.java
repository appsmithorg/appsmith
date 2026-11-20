package com.appsmith.server.diagnostics.collectors;

import com.appsmith.server.configurations.DeploymentProperties;
import com.appsmith.server.configurations.ProjectProperties;
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

    private static final String UNKNOWN = "UNKNOWN";

    private static final Set<String> ALLOWED_KEYS = Set.of(
            "edition",
            "version",
            "commitSha",
            "instanceId",
            "configuredPublicUrl",
            "uptimeSeconds",
            "javaVersion",
            "osName",
            "osArch");

    private final DeploymentProperties deploymentProperties;
    private final ProjectProperties projectProperties;
    private final ConfigService configService;

    @Override
    public DiagnosticsSectionId sectionId() {
        return DiagnosticsSectionId.INSTANCE;
    }

    @Override
    public Set<String> allowedKeys() {
        return ALLOWED_KEYS;
    }

    @Override
    public Mono<Map<String, Object>> collect() {
        return Mono.defer(configService::getInstanceId)
                .onErrorResume(error -> {
                    log.debug(
                            "Support diagnostics instance ID lookup failed with {}",
                            error.getClass().getName());
                    return Mono.empty();
                })
                .defaultIfEmpty(UNKNOWN)
                .map(instanceId -> {
                    Map<String, Object> data = new LinkedHashMap<>();
                    data.put("edition", orUnknown(deploymentProperties.getEdition()));
                    data.put("version", orUnknown(projectProperties.getVersion()));
                    data.put("commitSha", orUnknown(projectProperties.getCommitSha()));
                    data.put("instanceId", orUnknown(instanceId));
                    data.put("configuredPublicUrl", UNKNOWN);
                    data.put(
                            "uptimeSeconds",
                            ManagementFactory.getRuntimeMXBean().getUptime() / 1000);
                    data.put("javaVersion", System.getProperty("java.version"));
                    data.put("osName", normalizeOsName(System.getProperty("os.name")));
                    data.put("osArch", normalizeOsArch(System.getProperty("os.arch")));
                    return data;
                });
    }

    static String normalizeOsName(String name) {
        if (!StringUtils.hasText(name)) {
            return UNKNOWN;
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
        return "other";
    }

    static String normalizeOsArch(String arch) {
        if (!StringUtils.hasText(arch)) {
            return UNKNOWN;
        }
        return switch (arch) {
            case "amd64", "x86_64" -> "amd64";
            case "aarch64", "arm64" -> "arm64";
            default -> "other";
        };
    }

    private static String orUnknown(String value) {
        return StringUtils.hasText(value) ? value : UNKNOWN;
    }
}
