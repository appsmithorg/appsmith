package com.appsmith.server.aspect.component.ce;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface TestComponentCE {

    Mono<String> ceCeCompatibleEeSameImplMethod();

    // Method to test the case where the CE and EE interfaces have the same method name but different return types
    // and no implementations in  CE compatible class
    Mono<String> ceEeDiffMethod();

    Flux<String> ceEeDiffMethodReturnsFlux();

    String ceEeSyncMethod(String arg, String organizationId);

    void ceEeThrowAppsmithException(String arg, String organizationId);

    void ceEeThrowNonAppsmithException(String arg, String organizationId);

    String ceEeSyncMethodWithoutOrgId(String arg);
}
