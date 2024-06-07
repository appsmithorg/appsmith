package com.appsmith.server.services.ce;

import com.appsmith.external.models.BaseDomain;
import reactor.core.publisher.Mono;

public interface SequenceServiceCE {

    Mono<String> getNextAsSuffix(Class<? extends BaseDomain> domainClass, String suffix);
}
