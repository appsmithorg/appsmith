package com.appsmith.server.services.ce;

import com.appsmith.external.models.BaseDomain;
import reactor.core.publisher.Mono;

public interface SequenceServiceCE {

    Mono<Long> getNext(String name);

    Mono<Long> getNext(Class<? extends BaseDomain> domainClass, String suffix);

    Mono<String> getNextAsSuffix(Class<? extends BaseDomain> domainClass, String suffix);

}
