package com.appsmith.server.aspect.component;

import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.aspect.component.ce_compatible.TestComponentCECompatibleImpl;
import com.appsmith.server.featureflags.FeatureFlagEnum;
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

    @FeatureFlagged(featureFlagName = FeatureFlagEnum.TENANT_TEST_FEATURE)
    @Override
    public Mono<String> ceEeDiffMethod() {
        return Mono.just("ee_impl_method");
    }

    @FeatureFlagged(featureFlagName = FeatureFlagEnum.TENANT_TEST_FEATURE)
    @Override
    public Mono<String> eeCeCompatibleDiffMethod() {
        return Mono.just("ee_impl_method");
    }

    @FeatureFlagged(featureFlagName = FeatureFlagEnum.TENANT_TEST_FEATURE)
    @Override
    public Flux<String> ceEeDiffMethodReturnsFlux() {
        List<String> result = List.of("ee", "impl", "method");
        return Flux.fromIterable(result);
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.TENANT_TEST_FEATURE)
    public String ceEeSyncMethod(String arg) {
        return arg + "ee_impl_method";
    }
}
