package com.appsmith.server.aspect.component.ce;

import lombok.Getter;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@Getter
public class TestComponentCEImpl implements TestComponentCE {

    protected String testField = null;

    @Override
    public Mono<String> ceCeCompatibleEeSameImplMethod() {
        return Mono.just("ce_impl_method");
    }

    @Override
    public Mono<String> ceEeDiffMethod() {
        // CE Implementation
        return Mono.just("ce_impl_method");
    }

    @Override
    public void setTestField() {
        testField = "ce_testField";
    }

    @Override
    public Mono<String> methodWithSideEffect() {
        return Mono.just(testField);
    }
}
