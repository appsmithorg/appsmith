package com.appsmith.server.services;

import com.appsmith.external.models.BaseDomain;
import reactor.core.publisher.Mono;

public interface SequenceService {

    Mono<Long> getNext(String name);

    Mono<Long> getNext(Class<? extends BaseDomain> domainClass);

    Mono<String> getNextAsSuffix(Class<? extends BaseDomain> domainClass);

}
