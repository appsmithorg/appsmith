package com.appsmith.server.aspect.component.ce;

import lombok.Getter;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@Getter
public class TestComponentCEImpl implements TestComponentCE {

    private String fieldWithExplicitSetter = null;

    private String fieldUpdatedInDiffMethodOverriddenWithFeatureFlagged = null;

    @Override
    public Mono<String> ceCeCompatibleEeSameImplMethod() {
        fieldUpdatedInDiffMethodOverriddenWithFeatureFlagged = "ce_fieldUpdatedInDiffMethod";
        return Mono.just("ce_impl_method");
    }

    @Override
    public Mono<String> ceEeDiffMethod() {
        // CE Implementation
        return Mono.just("ce_impl_method");
    }

    @Override
    public void setFieldWithExplicitSetter() {
        fieldWithExplicitSetter = "ce_testField";
    }

    @Override
    public Mono<String> getterForFieldWithExplicitSetter() {
        return Mono.just(fieldWithExplicitSetter);
    }

    @Override
    public Mono<String> getterForFieldWithoutExplicitSetter() {
        return Mono.just(fieldUpdatedInDiffMethodOverriddenWithFeatureFlagged);
    }
}
