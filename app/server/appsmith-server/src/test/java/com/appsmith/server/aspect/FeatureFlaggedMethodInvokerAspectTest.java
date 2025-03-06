package com.appsmith.server.aspect;

import com.appsmith.external.enums.FeatureFlagEnum;
import com.appsmith.server.aspect.component.TestComponent;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.CachedFeatures;
import com.appsmith.server.services.FeatureFlagService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

@SpringBootTest
class FeatureFlaggedMethodInvokerAspectTest {

    @SpyBean
    FeatureFlagService featureFlagService;

    @Autowired
    TestComponent testComponent;

    private static final String EE_RESPONSE = "ee_impl_method";
    private static final String CE_COMPATIBLE_RESPONSE = "ce_compatible_impl_method";
    private static final String CE_RESPONSE = "ce_impl_method";

    @BeforeEach
    void setUp() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.ORGANIZATION_TEST_FEATURE)))
                .thenReturn(Mono.just(false));

        CachedFeatures cachedFeatures = new CachedFeatures();
        cachedFeatures.setFeatures(Map.of(FeatureFlagEnum.ORGANIZATION_TEST_FEATURE.name(), Boolean.FALSE));
        Mockito.when(featureFlagService.getCachedOrganizationFeatureFlags(any()))
                .thenReturn(cachedFeatures);
    }

    @Test
    void testEEOnlyMethod() {
        Mono<String> resultMono = testComponent.eeOnlyMethod();
        StepVerifier.create(resultMono).expectNext(EE_RESPONSE).verifyComplete();
    }

    @Test
    void eeCeCompatibleDiffMethod_eeImplTest() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.ORGANIZATION_TEST_FEATURE)))
                .thenReturn(Mono.just(true));
        Mono<String> resultMono = testComponent.eeCeCompatibleDiffMethod();
        StepVerifier.create(resultMono).expectNext(EE_RESPONSE).verifyComplete();
    }

    @Test
    void eeCeCompatibleDiffMethod_ceCompatibleImplTest() {
        Mono<String> resultMono = testComponent.eeCeCompatibleDiffMethod();
        StepVerifier.create(resultMono).expectNext(CE_COMPATIBLE_RESPONSE).verifyComplete();
    }

    @Test
    void ceCECompatibleEeSameImplMethod_eeImplTest() {
        Mono<String> resultMono = testComponent.ceCeCompatibleEeSameImplMethod();
        StepVerifier.create(resultMono).expectNext(CE_RESPONSE).verifyComplete();
    }

    @Test
    void ceCECompatibleEeSameImplMethod_ceCompatibleImplTest() {
        Mono<String> resultMono = testComponent.ceCeCompatibleEeSameImplMethod();
        StepVerifier.create(resultMono).expectNext(CE_RESPONSE).verifyComplete();
    }

    @Test
    void ceEeDiffMethod_ceImplTest() {
        // As CE compatible version don't have the implementation, it will fallback to CE implementation
        Mono<String> resultMono = testComponent.ceEeDiffMethod();
        StepVerifier.create(resultMono).expectNext(CE_RESPONSE).verifyComplete();
    }

    @Test
    void ceEeDiffMethod_eeImplTest() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.ORGANIZATION_TEST_FEATURE)))
                .thenReturn(Mono.just(true));
        Mono<String> resultMono = testComponent.ceEeDiffMethod();
        StepVerifier.create(resultMono).expectNext(EE_RESPONSE).verifyComplete();
    }

    @Test
    void ceEeDiffMethodReturnsFlux_eeImplTest() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.ORGANIZATION_TEST_FEATURE)))
                .thenReturn(Mono.just(true));
        Flux<String> resultFlux = testComponent.ceEeDiffMethodReturnsFlux();
        StepVerifier.create(resultFlux).expectNext("ee", "impl", "method").verifyComplete();
    }

    @Test
    void ceEeDiffMethodReturnsFlux_ceImplTest() {
        Flux<String> resultFlux = testComponent.ceEeDiffMethodReturnsFlux();
        StepVerifier.create(resultFlux).expectNext("ce", "impl", "method").verifyComplete();
    }

    @Test
    void ceEeSyncMethod_eeImplTest() {
        CachedFeatures cachedFeatures = new CachedFeatures();
        cachedFeatures.setFeatures(Map.of(FeatureFlagEnum.ORGANIZATION_TEST_FEATURE.name(), Boolean.TRUE));
        Mockito.when(featureFlagService.getCachedOrganizationFeatureFlags(any()))
                .thenReturn(cachedFeatures);
        String result = testComponent.ceEeSyncMethod("arg_");
        assertEquals("arg_ee_impl_method", result);
    }

    @Test
    void ceEeSyncMethod_ceImplTest() {
        String result = testComponent.ceEeSyncMethod("arg_");
        assertEquals("arg_ce_impl_method", result);
    }

    @Test
    void ceEeThrowAppsmithException_eeImplTest() {
        CachedFeatures cachedFeatures = new CachedFeatures();
        cachedFeatures.setFeatures(Map.of(FeatureFlagEnum.ORGANIZATION_TEST_FEATURE.name(), Boolean.TRUE));
        Mockito.when(featureFlagService.getCachedOrganizationFeatureFlags(any()))
                .thenReturn(cachedFeatures);
        assertThrows(
                AppsmithException.class,
                () -> testComponent.ceEeThrowAppsmithException("arg_"),
                AppsmithError.GENERIC_BAD_REQUEST.getMessage("This is a test exception"));
    }

    @Test
    void ceEeThrowNonAppsmithException_eeImplTest_throwExceptionFromAspect() {
        CachedFeatures cachedFeatures = new CachedFeatures();
        cachedFeatures.setFeatures(Map.of(FeatureFlagEnum.ORGANIZATION_TEST_FEATURE.name(), Boolean.TRUE));
        Mockito.when(featureFlagService.getCachedOrganizationFeatureFlags(any()))
                .thenReturn(cachedFeatures);
        assertThrows(
                AppsmithException.class,
                () -> testComponent.ceEeThrowNonAppsmithException("arg_"),
                AppsmithError.INVALID_METHOD_LEVEL_ANNOTATION_USAGE.getMessage(
                        "FeatureFlagged",
                        "TestComponentImpl",
                        "ceEeThrowNonAppsmithException",
                        "Exception while invoking super class method"));
    }
}
