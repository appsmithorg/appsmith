package com.appsmith.server.diagnostics.collectors;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.DeploymentProperties;
import com.appsmith.server.diagnostics.dtos.DiagnosticsField;
import com.appsmith.server.diagnostics.dtos.DiagnosticsSectionId;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

/**
 * Reports the Deployment and infrastructure section. Every value carries its source and confidence.
 * The container hostname is never read.
 */
@Component
@RequiredArgsConstructor
public class DeploymentDiagnosticsCollector implements DiagnosticsCollector {

    private static final String AVAILABLE = "available";
    private static final String OTHER = "other";

    // Values that deploy/docker/fs/opt/appsmith/generate-infra-details.sh writes to infra.json, with the confidence
    // of each.
    private static final Map<String, String> KNOWN_TOOLS = Map.of(
            "kubernetes", DiagnosticsField.CONFIDENCE_DETECTED,
            "likely docker", DiagnosticsField.CONFIDENCE_INFERRED,
            "ecs-fargate", DiagnosticsField.CONFIDENCE_INFERRED);
    private static final Map<String, String> KNOWN_CLOUD_PROVIDERS = Map.of(
            "amazon", DiagnosticsField.CONFIDENCE_INFERRED,
            "azure", DiagnosticsField.CONFIDENCE_INFERRED,
            "gcp", DiagnosticsField.CONFIDENCE_INFERRED,
            "digitalocean", DiagnosticsField.CONFIDENCE_INFERRED,
            "alibaba", DiagnosticsField.CONFIDENCE_INFERRED,
            "heroku", DiagnosticsField.CONFIDENCE_INFERRED,
            "others(including local)", DiagnosticsField.CONFIDENCE_INFERRED);
    // infra.json reports efs=present for any NFS mount on /appsmith-stacks, so the value is inferred.
    private static final Map<String, String> KNOWN_EFS_VALUES =
            Map.of("present", DiagnosticsField.CONFIDENCE_INFERRED, "absent", DiagnosticsField.CONFIDENCE_INFERRED);

    private static final Set<String> ALLOWED_KEYS =
            Set.of("tool", "cloudProvider", "efs", "appsmithCloud", "cpuCount", "maxMemoryBytes", "replicas");

    private final DeploymentProperties deploymentProperties;
    private final CommonConfig commonConfig;

    @Override
    public DiagnosticsSectionId sectionId() {
        return DiagnosticsSectionId.DEPLOYMENT;
    }

    @Override
    public Set<String> allowedKeys() {
        return ALLOWED_KEYS;
    }

    @Override
    public Mono<Map<String, Object>> collect() {
        return Mono.fromSupplier(() -> {
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("tool", runtimeField(deploymentProperties.getTool(), KNOWN_TOOLS));
            data.put("cloudProvider", runtimeField(deploymentProperties.getCloudProvider(), KNOWN_CLOUD_PROVIDERS));
            data.put("efs", runtimeField(deploymentProperties.getEfs(), KNOWN_EFS_VALUES));
            data.put(
                    "appsmithCloud",
                    new DiagnosticsField(
                            commonConfig.getIsCloudHosting(),
                            DiagnosticsField.SOURCE_APPLICATION_CONFIG,
                            DiagnosticsField.CONFIDENCE_CONFIGURED,
                            AVAILABLE));
            data.put(
                    "cpuCount",
                    detectedRuntime(Integer.valueOf(Runtime.getRuntime().availableProcessors())));
            data.put(
                    "maxMemoryBytes",
                    detectedRuntime(Long.valueOf(Runtime.getRuntime().maxMemory())));
            data.put("replicas", DiagnosticsField.unknown(DiagnosticsField.SOURCE_ORCHESTRATOR));
            return data;
        });
    }

    /**
     * Maps a value read from {@code infra.json} to a field. A value from {@code knownValues} is reported as is, with
     * its confidence. Any other non-blank value is reported as {@link #OTHER}, so free text never leaves the
     * instance. A null or blank value is unknown.
     */
    private static DiagnosticsField runtimeField(String value, Map<String, String> knownValues) {
        if (!StringUtils.hasText(value)) {
            return DiagnosticsField.unknown(DiagnosticsField.SOURCE_RUNTIME);
        }
        String confidence = knownValues.get(value);
        if (confidence == null) {
            return new DiagnosticsField(
                    OTHER, DiagnosticsField.SOURCE_RUNTIME, DiagnosticsField.CONFIDENCE_INFERRED, AVAILABLE);
        }
        return new DiagnosticsField(value, DiagnosticsField.SOURCE_RUNTIME, confidence, AVAILABLE);
    }

    private DiagnosticsField detectedRuntime(Object value) {
        return new DiagnosticsField(
                value, DiagnosticsField.SOURCE_RUNTIME, DiagnosticsField.CONFIDENCE_DETECTED, AVAILABLE);
    }
}
