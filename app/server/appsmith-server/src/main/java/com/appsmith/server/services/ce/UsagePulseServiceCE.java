package com.appsmith.server.services.ce;

import com.appsmith.server.domains.UsagePulse;
import com.appsmith.server.dtos.UsagePulseDTO;
import reactor.core.publisher.Mono;

public interface UsagePulseServiceCE {
    Mono<UsagePulse> createPulse(UsagePulseDTO usagePulseDTO);

    Mono<UsagePulse> save(UsagePulse usagePulse);
}
