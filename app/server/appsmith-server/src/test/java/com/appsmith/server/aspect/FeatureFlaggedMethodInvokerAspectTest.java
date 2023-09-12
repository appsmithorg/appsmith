package com.appsmith.server.aspect;

import com.appsmith.server.aspect.component.TestComponent;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.services.FeatureFlagService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.mockito.ArgumentMatchers.eq;

@SpringBootTest
@ExtendWith(SpringExtension.class)
class FeatureFlaggedMethodInvokerAspectTest {

    @MockBean
    FeatureFlagService featureFlagService;

    @Autowired
    TestComponent testComponent;

    private static String EE_RESPONSE = "ee_impl_method";
    private static String CE_COMPATIBLE_RESPONSE = "ce_compatible_impl_method";
    private static String CE_RESPONSE = "ce_impl_method";

    @Test
    void testEEOnlyMethod() {
        Mono<String> resultMono = testComponent.eeOnlyMethod();
        StepVerifier.create(resultMono).expectNext(EE_RESPONSE).verifyComplete();
    }

    @Test
    void eeCeCompatibleDiffMethod_eeImplTest() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.TENANT_TEST_FEATURE)))
                .thenReturn(Mono.just(true));
        Mono<String> resultMono = testComponent.eeCeCompatibleDiffMethod();
        StepVerifier.create(resultMono).expectNext(EE_RESPONSE).verifyComplete();
    }

    @Test
    void eeCeCompatibleDiffMethod_ceCompatibleImplTest() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.TENANT_TEST_FEATURE)))
                .thenReturn(Mono.just(false));
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
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.TENANT_TEST_FEATURE)))
                .thenReturn(Mono.just(false));
        // As CE compatible version don't have the implementation, it will fallback to CE implementation
        Mono<String> resultMono = testComponent.ceEeDiffMethod();
        StepVerifier.create(resultMono).expectNext(CE_RESPONSE).verifyComplete();
    }

    @Test
    void ceEeDiffMethod_eeImplTest() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.TENANT_TEST_FEATURE)))
                .thenReturn(Mono.just(true));
        Mono<String> resultMono = testComponent.ceEeDiffMethod();
        StepVerifier.create(resultMono).expectNext(EE_RESPONSE).verifyComplete();
    }
}
