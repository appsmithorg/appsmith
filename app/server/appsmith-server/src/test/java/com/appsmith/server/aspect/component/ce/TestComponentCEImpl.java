package com.appsmith.server.aspect.component.ce;

import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
public class TestComponentCEImpl implements TestComponentCE {

    @Override
    public Mono<String> ceCeCompatibleEeSameImplMethod() {
        return Mono.just("ce_impl_method");
    }

    @Override
    public Mono<String> ceEeDiffMethod() {
        // CE Implementation
        return Mono.just("ce_impl_method");
    }
}
