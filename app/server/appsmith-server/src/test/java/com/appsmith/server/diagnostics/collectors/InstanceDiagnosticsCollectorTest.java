package com.appsmith.server.diagnostics.collectors;

import com.appsmith.server.configurations.DeploymentProperties;
import com.appsmith.server.configurations.ProjectProperties;
import com.appsmith.server.diagnostics.DiagnosticsRedactionGuard;
import com.appsmith.server.diagnostics.dtos.DiagnosticsSectionId;
import com.appsmith.server.services.ConfigService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.parallel.ResourceLock;
import org.junit.jupiter.api.parallel.Resources;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@ResourceLock(Resources.SYSTEM_PROPERTIES)
class InstanceDiagnosticsCollectorTest {

    @Mock
    private DeploymentProperties deploymentProperties;

    @Mock
    private ProjectProperties projectProperties;

    @Mock
    private ConfigService configService;

    @InjectMocks
    private InstanceDiagnosticsCollector collector;

    private final DiagnosticsRedactionGuard guard = new DiagnosticsRedactionGuard(new ObjectMapper());

    @Test
    void should_reportInstanceSection_when_asked() {
        // When / Then
        assertThat(collector.sectionId()).isEqualTo(DiagnosticsSectionId.INSTANCE);
    }

    @Test
    void should_reportBuildAndInstanceIdentity_when_collected() {
        // Given
        String instanceId = UUID.randomUUID().toString();
        when(deploymentProperties.getEdition()).thenReturn("EE");
        when(projectProperties.getVersion()).thenReturn("1.9.30-SNAPSHOT");
        when(projectProperties.getCommitSha()).thenReturn("9e1d4bda82");
        when(configService.getInstanceId()).thenReturn(Mono.just(instanceId));
        String originalJavaVersion = System.getProperty("java.version");
        String originalOsName = System.getProperty("os.name");
        System.setProperty("java.version", "21.0.5");
        System.setProperty("os.name", "Linux");

        // When
        var result = collector.collect("org-1");

        // Then
        try {
            StepVerifier.create(result)
                    .assertNext(data -> {
                        assertThat(data)
                                .containsEntry("edition", "EE")
                                .containsEntry("version", "1.9.30-SNAPSHOT")
                                .containsEntry("instanceId", instanceId)
                                .containsEntry("configuredPublicUrl", "UNKNOWN")
                                .containsEntry("javaVersion", "21.0.5")
                                .containsEntry("osName", "linux")
                                .containsEntry("commitSha", "9e1d4bda82");
                        assertThat(data.get("uptimeSeconds")).isInstanceOf(Long.class);
                        assertThat((Long) data.get("uptimeSeconds")).isGreaterThanOrEqualTo(0L);
                        assertThat(data.get("osArch"))
                                .isEqualTo(InstanceDiagnosticsCollector.normalizeOsArch(System.getProperty("os.arch")));
                        assertThat(data.keySet())
                                .isSubsetOf(collector.schema().keys().keySet());
                        assertThat(guard.violation(collector.schema(), data)).isEmpty();
                    })
                    .verifyComplete();
        } finally {
            System.setProperty("java.version", originalJavaVersion);
            System.setProperty("os.name", originalOsName);
        }
    }

    @ParameterizedTest
    @ValueSource(strings = {"ABCDEF1", "db.internal", "has space"})
    void should_reportUnknownCommitSha_when_valueIsNotLowercaseHex(String sha) {
        // Given
        when(projectProperties.getCommitSha()).thenReturn(sha);
        when(configService.getInstanceId()).thenReturn(Mono.empty());

        // When
        var result = collector.collect("org-1");

        // Then
        StepVerifier.create(result)
                .assertNext(data -> {
                    assertThat(data).containsEntry("commitSha", "UNKNOWN");
                    assertThat(guard.violation(collector.schema(), data)).isEmpty();
                })
                .verifyComplete();
    }

    @ParameterizedTest
    @ValueSource(strings = {"v1.99", "1.8.0_352", "release candidate"})
    void should_reportUnknownVersion_when_versionDoesNotMatchTheVersionPattern(String version) {
        // Given
        when(projectProperties.getVersion()).thenReturn(version);
        when(configService.getInstanceId()).thenReturn(Mono.empty());

        // When
        var result = collector.collect("org-1");

        // Then
        StepVerifier.create(result)
                .assertNext(data -> {
                    assertThat(data.get("version")).isEqualTo(version.equals("v1.99") ? "1.99" : "UNKNOWN");
                    assertThat(guard.violation(collector.schema(), data)).isEmpty();
                })
                .verifyComplete();
    }

    @Test
    void should_reportUnknownInstanceId_when_configHasNone() {
        // Given
        when(configService.getInstanceId()).thenReturn(Mono.empty());

        // When
        var result = collector.collect("org-1");

        // Then
        StepVerifier.create(result)
                .assertNext(data -> assertThat(data).containsEntry("instanceId", "UNKNOWN"))
                .verifyComplete();
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = {"", "   "})
    void should_reportUnknownIdentity_when_valuesAreNullOrBlank(String value) {
        // Given
        when(deploymentProperties.getEdition()).thenReturn(value);
        when(projectProperties.getVersion()).thenReturn(value);
        when(projectProperties.getCommitSha()).thenReturn(value);
        when(configService.getInstanceId()).thenReturn(Mono.justOrEmpty(value));

        // When
        var result = collector.collect("org-1");

        // Then
        StepVerifier.create(result)
                .assertNext(data -> assertThat(data)
                        .containsEntry("edition", "UNKNOWN")
                        .containsEntry("version", "UNKNOWN")
                        .containsEntry("commitSha", "UNKNOWN")
                        .containsEntry("instanceId", "UNKNOWN"))
                .verifyComplete();
    }

    @Test
    void should_reportUnknownInstanceId_when_configLookupFails() {
        // Given
        when(configService.getInstanceId()).thenReturn(Mono.error(new IllegalStateException("db down")));

        // When
        var result = collector.collect("org-1");

        // Then
        StepVerifier.create(result)
                .assertNext(data -> assertThat(data).containsEntry("instanceId", "UNKNOWN"))
                .verifyComplete();
    }

    @ParameterizedTest
    @CsvSource({
        "Linux, linux",
        "Linux-acme-internal-image, linux",
        "Mac OS X, macos",
        "Windows 11, windows",
        "acme-os, other",
        "FreeBSD, other"
    })
    void should_mapOsNameToFixedValue_when_osNameIsSet(String raw, String expected) {
        // When
        String result = InstanceDiagnosticsCollector.normalizeOsName(raw);

        // Then
        assertThat(result).isEqualTo(expected);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   "})
    void should_reportUnknownOsName_when_osNameIsNullOrBlank(String raw) {
        // When
        String result = InstanceDiagnosticsCollector.normalizeOsName(raw);

        // Then
        assertThat(result).isEqualTo("UNKNOWN");
    }

    @ParameterizedTest
    @CsvSource({"amd64, amd64", "x86_64, amd64", "aarch64, arm64", "arm64, arm64", "acme-arch, other", "ppc64le, other"
    })
    void should_mapOsArchToFixedValue_when_osArchIsSet(String raw, String expected) {
        // When
        String result = InstanceDiagnosticsCollector.normalizeOsArch(raw);

        // Then
        assertThat(result).isEqualTo(expected);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   "})
    void should_reportUnknownOsArch_when_osArchIsNullOrBlank(String raw) {
        // When
        String result = InstanceDiagnosticsCollector.normalizeOsArch(raw);

        // Then
        assertThat(result).isEqualTo("UNKNOWN");
    }
}
