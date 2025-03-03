package com.appsmith.server.aspect.component;

import com.appsmith.external.annotations.FeatureFlagged;
import com.appsmith.external.enums.FeatureFlagEnum;
import com.appsmith.server.aspect.component.ce_compatible.TestComponentCECompatibleImpl;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
public class TestComponentImpl extends TestComponentCECompatibleImpl implements TestComponent {

    @Override
    public Mono<String> eeOnlyMethod() {
        return Mono.just("ee_impl_method");
    }

    @FeatureFlagged(featureFlagName = FeatureFlagEnum.ORGANIZATION_TEST_FEATURE)
    @Override
    public Mono<String> ceEeDiffMethod() {
        return Mono.just("ee_impl_method");
    }

    @FeatureFlagged(featureFlagName = FeatureFlagEnum.ORGANIZATION_TEST_FEATURE)
    @Override
    public Mono<String> eeCeCompatibleDiffMethod() {
        return Mono.just("ee_impl_method");
    }

    @FeatureFlagged(featureFlagName = FeatureFlagEnum.ORGANIZATION_TEST_FEATURE)
    @Override
    public Flux<String> ceEeDiffMethodReturnsFlux() {
        List<String> result = List.of("ee", "impl", "method");
        return Flux.fromIterable(result);
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.ORGANIZATION_TEST_FEATURE)
    public String ceEeSyncMethod(String arg, String organizationId) {
        return arg + "ee_impl_method";
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.ORGANIZATION_TEST_FEATURE)
    public void ceEeThrowAppsmithException(String arg, String organizationId) {
        throw new AppsmithException(AppsmithError.GENERIC_BAD_REQUEST, "This is a test exception");
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.ORGANIZATION_TEST_FEATURE)
    public void ceEeThrowNonAppsmithException(String arg, String organizationId) {
        throw new RuntimeException("This is a test exception");
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.ORGANIZATION_TEST_FEATURE)
    public String ceEeSyncMethodWithoutOrgId(String arg) {
        return arg + "ee_impl_method";
    }
}
