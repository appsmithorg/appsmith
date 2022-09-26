package com.appsmith.server.services.ce;

import reactor.core.publisher.Mono;

public interface UsagePulseServiceCE {
    Mono<Void> createPulse();
}
