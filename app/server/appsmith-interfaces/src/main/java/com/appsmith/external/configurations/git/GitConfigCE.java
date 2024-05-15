package com.appsmith.external.configurations.git;

import reactor.core.publisher.Mono;

public interface GitConfigCE {
    Mono<Boolean> getIsAtomicPushAllowed();
}
