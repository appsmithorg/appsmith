package com.appsmith.server.diagnostics.collectors;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.DeploymentProperties;
import com.appsmith.server.diagnostics.dtos.DiagnosticsField;
import com.appsmith.server.diagnostics.dtos.DiagnosticsSectionId;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DeploymentDiagnosticsCollectorTest {

    @Mock
    private DeploymentProperties deploymentProperties;

    @Mock
    private CommonConfig commonConfig;

    @InjectMocks
    private DeploymentDiagnosticsCollector collector;

    @Test
    void should_reportDeploymentSection_when_asked() {
        // When
        DiagnosticsSectionId sectionId = collector.sectionId();

        // Then
        assertThat(sectionId).isEqualTo(DiagnosticsSectionId.DEPLOYMENT);
    }

    @ParameterizedTest
    @CsvSource({"kubernetes,detected", "likely docker,inferred", "ecs-fargate,inferred"})
    void should_labelToolConfidence_when_toolIsKnown(String tool, String confidence) {
        // Given
        when(deploymentProperties.getTool()).thenReturn(tool);

        // When
        var result = collector.collect();

        // Then
        StepVerifier.create(result)
                .assertNext(data -> assertThat(data.get("tool"))
                        .isEqualTo(new DiagnosticsField(tool, "runtime", confidence, "available")))
                .verifyComplete();
    }

    @Test
    void should_reportToolAsOther_when_toolIsNotKnown() {
        // Given
        when(deploymentProperties.getTool()).thenReturn("nomad");

        // When
        var result = collector.collect();

        // Then
        StepVerifier.create(result)
                .assertNext(data -> {
                    assertThat(data.get("tool"))
                            .isEqualTo(new DiagnosticsField("other", "runtime", "inferred", "available"));
                    assertThat(data.toString()).doesNotContain("nomad");
                })
                .verifyComplete();
    }

    @Test
    void should_reportEveryInfraFieldUnknown_when_infraFileIsMissing() {
        // Given: DeploymentProperties getters all return null

        // When
        var result = collector.collect();

        // Then
        StepVerifier.create(result)
                .assertNext(data -> {
                    assertThat(data.get("tool")).isEqualTo(DiagnosticsField.unknown("runtime"));
                    assertThat(data.get("cloudProvider")).isEqualTo(DiagnosticsField.unknown("runtime"));
                    assertThat(data.get("efs")).isEqualTo(DiagnosticsField.unknown("runtime"));
                })
                .verifyComplete();
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "   "})
    void should_reportInfraFieldUnknown_when_valueIsBlank(String blank) {
        // Given
        when(deploymentProperties.getTool()).thenReturn(blank);
        when(deploymentProperties.getCloudProvider()).thenReturn(blank);
        when(deploymentProperties.getEfs()).thenReturn(blank);

        // When
        var result = collector.collect();

        // Then
        StepVerifier.create(result)
                .assertNext(data -> {
                    assertThat(data.get("tool")).isEqualTo(DiagnosticsField.unknown("runtime"));
                    assertThat(data.get("cloudProvider")).isEqualTo(DiagnosticsField.unknown("runtime"));
                    assertThat(data.get("efs")).isEqualTo(DiagnosticsField.unknown("runtime"));
                })
                .verifyComplete();
    }

    @ParameterizedTest
    @ValueSource(strings = {"present", "absent"})
    void should_reportEfsAsInferred_when_efsIsKnown(String efs) {
        // Given
        when(deploymentProperties.getEfs()).thenReturn(efs);

        // When
        var result = collector.collect();

        // Then
        StepVerifier.create(result)
                .assertNext(data -> assertThat(data.get("efs"))
                        .isEqualTo(new DiagnosticsField(efs, "runtime", "inferred", "available")))
                .verifyComplete();
    }

    @Test
    void should_reportEfsAsOther_when_efsIsNotKnown() {
        // Given
        when(deploymentProperties.getEfs()).thenReturn("mounted");

        // When
        var result = collector.collect();

        // Then
        StepVerifier.create(result)
                .assertNext(data -> {
                    assertThat(data.get("efs"))
                            .isEqualTo(new DiagnosticsField("other", "runtime", "inferred", "available"));
                    assertThat(data.toString()).doesNotContain("mounted");
                })
                .verifyComplete();
    }

    @ParameterizedTest
    @ValueSource(strings = {"amazon", "azure", "gcp", "digitalocean", "alibaba", "heroku", "others(including local)"})
    void should_reportCloudProviderAsInferred_when_cloudProviderIsKnown(String cloudProvider) {
        // Given
        when(deploymentProperties.getCloudProvider()).thenReturn(cloudProvider);

        // When
        var result = collector.collect();

        // Then
        StepVerifier.create(result)
                .assertNext(data -> assertThat(data.get("cloudProvider"))
                        .isEqualTo(new DiagnosticsField(cloudProvider, "runtime", "inferred", "available")))
                .verifyComplete();
    }

    @ParameterizedTest
    @ValueSource(strings = {"aws", "db.internal.example.com", "mongodb://admin:hunter2@db.internal"})
    void should_reportCloudProviderAsOther_when_cloudProviderIsNotKnown(String cloudProvider) {
        // Given
        when(deploymentProperties.getCloudProvider()).thenReturn(cloudProvider);

        // When
        var result = collector.collect();

        // Then
        StepVerifier.create(result)
                .assertNext(data -> {
                    assertThat(data.get("cloudProvider"))
                            .isEqualTo(new DiagnosticsField("other", "runtime", "inferred", "available"));
                    assertThat(data.toString()).doesNotContain(cloudProvider);
                })
                .verifyComplete();
    }

    @ParameterizedTest
    @ValueSource(booleans = {true, false})
    void should_reportAppsmithCloudAsConfigured_when_flagIsSet(boolean isCloud) {
        // Given
        when(commonConfig.getIsCloudHosting()).thenReturn(isCloud);

        // When
        var result = collector.collect();

        // Then
        StepVerifier.create(result)
                .assertNext(data -> assertThat(data.get("appsmithCloud"))
                        .isEqualTo(new DiagnosticsField(isCloud, "application_config", "configured", "available")))
                .verifyComplete();
    }

    @Test
    void should_reportCpuAndMemoryFromJvm_when_collected() {
        // When
        var result = collector.collect();

        // Then
        StepVerifier.create(result)
                .assertNext(data -> {
                    DiagnosticsField cpu = (DiagnosticsField) data.get("cpuCount");
                    DiagnosticsField memory = (DiagnosticsField) data.get("maxMemoryBytes");
                    assertThat(cpu.value()).isInstanceOf(Integer.class);
                    assertThat((Integer) cpu.value()).isPositive();
                    assertThat(cpu.source()).isEqualTo("runtime");
                    assertThat(cpu.confidence()).isEqualTo("detected");
                    assertThat(cpu.availability()).isEqualTo("available");
                    assertThat(memory.value()).isInstanceOf(Long.class);
                    assertThat((Long) memory.value()).isPositive();
                    assertThat(memory.source()).isEqualTo("runtime");
                    assertThat(memory.confidence()).isEqualTo("detected");
                    assertThat(memory.availability()).isEqualTo("available");
                })
                .verifyComplete();
    }

    @Test
    void should_reportReplicasUnknown_when_collected() {
        // When
        var result = collector.collect();

        // Then
        StepVerifier.create(result)
                .assertNext(data -> assertThat(data.get("replicas"))
                        .isEqualTo(new DiagnosticsField("UNKNOWN", "orchestrator", "unknown", "unknown")))
                .verifyComplete();
    }

    @Test
    void should_neverExportHostname_when_collected() {
        // When
        var result = collector.collect();

        // Then
        StepVerifier.create(result)
                .assertNext(data -> assertThat(data).doesNotContainKey("hostname"))
                .verifyComplete();
        verify(deploymentProperties, never()).getHostname();
        assertThat(collector.allowedKeys()).doesNotContain("hostname");
    }

    @Test
    void should_emitOnlyAllowedKeys_when_collected() {
        // When
        var result = collector.collect();

        // Then
        StepVerifier.create(result)
                .assertNext(data -> assertThat(data.keySet()).isEqualTo(collector.allowedKeys()))
                .verifyComplete();
    }
}
