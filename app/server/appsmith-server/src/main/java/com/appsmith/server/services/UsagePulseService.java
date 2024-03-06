package com.appsmith.server.services;

import com.appsmith.server.services.ce.UsagePulseServiceCE;
import reactor.core.publisher.Mono;

public interface UsagePulseService extends UsagePulseServiceCE {
    Mono<Boolean> sendAndUpdateUsagePulse();
}
