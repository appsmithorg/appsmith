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

    Mono<Void> ceEeThrowAppsmithException(String arg);

    Mono<Void> ceEeThrowNonAppsmithException(String arg);

    String ceEeSyncMethodWithoutOrganization(String arg);
}
