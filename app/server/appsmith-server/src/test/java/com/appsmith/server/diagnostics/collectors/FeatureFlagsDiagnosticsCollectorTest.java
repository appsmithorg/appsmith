package com.appsmith.server.diagnostics.collectors;

import com.appsmith.external.enums.FeatureFlagEnum;
import com.appsmith.server.diagnostics.DiagnosticsRedactionGuard;
import com.appsmith.server.diagnostics.DiagnosticsValues;
import com.appsmith.server.diagnostics.dtos.DiagnosticsSectionId;
import com.appsmith.server.services.FeatureFlagService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FeatureFlagsDiagnosticsCollectorTest {

    private static final Set<String> TEST_FLAGS = Set.of(
            FeatureFlagEnum.TEST_FEATURE_1.name(),
            FeatureFlagEnum.TEST_FEATURE_2.name(),
            FeatureFlagEnum.TEST_FEATURE_3.name(),
            FeatureFlagEnum.ORGANIZATION_TEST_FEATURE.name());

    @Mock
    private FeatureFlagService featureFlagService;

    @InjectMocks
    private FeatureFlagsDiagnosticsCollector collector;

    private final DiagnosticsRedactionGuard guard = new DiagnosticsRedactionGuard(new ObjectMapper());

    @SuppressWarnings("unchecked")
    private static Map<String, Object> flagsOf(Map<String, Object> data) {
        return (Map<String, Object>) data.get("flags");
    }

    @Test
    void should_reportFeatureFlagsSection_when_asked() {
        // When
        DiagnosticsSectionId sectionId = collector.sectionId();

        // Then
        assertThat(sectionId).isEqualTo(DiagnosticsSectionId.FEATURE_FLAGS);
    }

    @Test
    void should_reportEveryEnumFlag_when_orgMapHasSome() {
        // Given
        when(featureFlagService.getOrganizationFeatures("org-1"))
                .thenReturn(Mono.just(Map.of(FeatureFlagEnum.APP_NAVIGATION_LOGO_UPLOAD.name(), true)));
        int expected = FeatureFlagEnum.values().length - 4;

        // When
        var result = collector.collect("org-1");

        // Then
        StepVerifier.create(result)
                .assertNext(data -> {
                    assertThat(data).containsEntry("source", "organization");
                    assertThat(data).containsEntry("knownFlagCount", expected);
                    assertThat(flagsOf(data)).hasSize(expected);
                    assertThat(flagsOf(data)).containsEntry(FeatureFlagEnum.APP_NAVIGATION_LOGO_UPLOAD.name(), true);
                    assertThat(flagsOf(data))
                            .containsEntry(
                                    FeatureFlagEnum.release_static_url_enabled.name(), DiagnosticsValues.UNKNOWN);
                })
                .verifyComplete();
    }

    @Test
    void should_dropKeysOutsideEnum_when_orgMapHasThem() {
        // Given
        Map<String, Boolean> orgFlags = new HashMap<>();
        orgFlags.put("not_a_real_flag", true);
        orgFlags.put(FeatureFlagEnum.APP_NAVIGATION_LOGO_UPLOAD.name(), true);
        when(featureFlagService.getOrganizationFeatures("org-1")).thenReturn(Mono.just(orgFlags));

        // When
        var result = collector.collect("org-1");

        // Then
        StepVerifier.create(result)
                .assertNext(data -> assertThat(flagsOf(data)).doesNotContainKey("not_a_real_flag"))
                .verifyComplete();
    }

    @Test
    void should_excludeTestFlags_when_collecting() {
        // Given
        Map<String, Boolean> orgFlags = new HashMap<>();
        TEST_FLAGS.forEach(name -> orgFlags.put(name, true));
        when(featureFlagService.getOrganizationFeatures("org-1")).thenReturn(Mono.just(orgFlags));

        // When
        var result = collector.collect("org-1");

        // Then
        StepVerifier.create(result)
                .assertNext(data -> assertThat(flagsOf(data).keySet()).doesNotContainAnyElementsOf(TEST_FLAGS))
                .verifyComplete();
    }

    @Test
    void should_keepFalse_when_flagIsFalse() {
        // Given
        when(featureFlagService.getOrganizationFeatures("org-1"))
                .thenReturn(Mono.just(Map.of(FeatureFlagEnum.APP_NAVIGATION_LOGO_UPLOAD.name(), false)));

        // When
        var result = collector.collect("org-1");

        // Then
        StepVerifier.create(result)
                .assertNext(data -> assertThat(flagsOf(data))
                        .containsEntry(FeatureFlagEnum.APP_NAVIGATION_LOGO_UPLOAD.name(), false))
                .verifyComplete();
    }

    @Test
    void should_reportAllUnknown_when_orgMapEmpty() {
        // Given
        when(featureFlagService.getOrganizationFeatures("org-1")).thenReturn(Mono.just(Map.of()));

        // When
        var result = collector.collect("org-1");

        // Then
        StepVerifier.create(result)
                .assertNext(data -> assertThat(flagsOf(data).values()).containsOnly(DiagnosticsValues.UNKNOWN))
                .verifyComplete();
    }

    @Test
    void should_matchCategoryPattern_when_anyFeatureFlagName() {
        // Given
        Pattern safeName = Pattern.compile("^[A-Za-z0-9_-]{1,64}$");

        // When
        List<String> names = Arrays.stream(FeatureFlagEnum.values())
                .map(FeatureFlagEnum::name)
                .toList();

        // Then
        assertThat(names).allMatch(name -> safeName.matcher(name).matches());
    }

    @Test
    void should_neverCallUserLevelMethods_when_collecting() {
        // Given
        when(featureFlagService.getOrganizationFeatures("org-1")).thenReturn(Mono.just(Map.of()));

        // When
        collector.collect("org-1").block();

        // Then
        verify(featureFlagService).getOrganizationFeatures("org-1");
        verifyNoMoreInteractions(featureFlagService);
    }

    @Test
    void should_passTheRedactionGuard_when_collected() {
        // Given
        Map<String, Boolean> orgFlags = new HashMap<>();
        Arrays.stream(FeatureFlagEnum.values()).limit(5).forEach(f -> orgFlags.put(f.name(), true));
        when(featureFlagService.getOrganizationFeatures("org-1")).thenReturn(Mono.just(orgFlags));

        // When
        var result = collector.collect("org-1");

        // Then
        StepVerifier.create(result)
                .assertNext(data ->
                        assertThat(guard.violation(collector.schema(), data)).isEmpty())
                .verifyComplete();
    }
}
