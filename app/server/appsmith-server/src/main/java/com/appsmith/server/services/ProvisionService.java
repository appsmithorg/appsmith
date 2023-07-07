package com.appsmith.server.services;

import reactor.core.publisher.Mono;

public interface ProvisionService {
    Mono<String> generateProvisionToken();
}
