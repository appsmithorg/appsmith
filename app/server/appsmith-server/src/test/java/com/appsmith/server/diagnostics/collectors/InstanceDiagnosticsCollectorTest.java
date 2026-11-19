package com.appsmith.server.diagnostics.collectors;

import com.appsmith.server.configurations.DeploymentProperties;
import com.appsmith.server.configurations.ProjectProperties;
import com.appsmith.server.diagnostics.dtos.DiagnosticsSectionId;
import com.appsmith.server.services.ConfigService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InstanceDiagnosticsCollectorTest {

    @Mock
    private DeploymentProperties deploymentProperties;

    @Mock
    private ProjectProperties projectProperties;

    @Mock
    private ConfigService configService;

    @InjectMocks
    private InstanceDiagnosticsCollector collector;

    @Test
    void should_reportInstanceSection_when_asked() {
        // When / Then
        assertThat(collector.sectionId()).isEqualTo(DiagnosticsSectionId.INSTANCE);
    }

    @Test
    void should_reportBuildAndInstanceIdentity_when_collected() {
        // Given
        when(deploymentProperties.getEdition()).thenReturn("EE");
        when(projectProperties.getVersion()).thenReturn("v1.99");
        when(projectProperties.getCommitSha()).thenReturn("abc123");
        when(configService.getInstanceId()).thenReturn(Mono.just("instance-1"));

        // When
        var result = collector.collect();

        // Then
        StepVerifier.create(result)
                .assertNext(data -> {
                    assertThat(data)
                            .containsEntry("edition", "EE")
                            .containsEntry("version", "v1.99")
                            .containsEntry("commitSha", "abc123")
                            .containsEntry("instanceId", "instance-1")
                            .containsEntry("configuredPublicUrl", "UNKNOWN");
                    assertThat(data.get("uptimeSeconds")).isInstanceOf(Long.class);
                    assertThat((Long) data.get("uptimeSeconds")).isGreaterThanOrEqualTo(0L);
                    assertThat(data.get("javaVersion")).isEqualTo(System.getProperty("java.version"));
                    assertThat(data.get("osName"))
                            .isEqualTo(InstanceDiagnosticsCollector.normalizeOsName(System.getProperty("os.name")));
                    assertThat(data.get("osArch"))
                            .isEqualTo(InstanceDiagnosticsCollector.normalizeOsArch(System.getProperty("os.arch")));
                    assertThat(data.keySet()).isSubsetOf(collector.allowedKeys());
                })
                .verifyComplete();
    }

    @Test
    void should_reportUnknownInstanceId_when_configHasNone() {
        // Given
        when(configService.getInstanceId()).thenReturn(Mono.empty());

        // When
        var result = collector.collect();

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
        var result = collector.collect();

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
        var result = collector.collect();

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
