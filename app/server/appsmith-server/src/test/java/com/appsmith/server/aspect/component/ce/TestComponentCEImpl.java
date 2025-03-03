package com.appsmith.server.aspect.component.ce;

import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

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

    @Override
    public Flux<String> ceEeDiffMethodReturnsFlux() {
        List<String> result = List.of("ce", "impl", "method");
        return Flux.fromIterable(result);
    }

    @Override
    public String ceEeSyncMethod(String arg, String organizationId) {
        return arg + "ce_impl_method";
    }

    @Override
    public void ceEeThrowAppsmithException(String arg, String organizationId) {}

    @Override
    public void ceEeThrowNonAppsmithException(String arg, String organizationId) {}

    @Override
    public String ceEeSyncMethodWithoutOrgId(String arg) {
        return arg + "ce_impl_method";
    }
}
