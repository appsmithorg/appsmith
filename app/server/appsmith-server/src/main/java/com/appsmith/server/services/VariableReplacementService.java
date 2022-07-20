package com.appsmith.server.services;

import reactor.core.publisher.Mono;

public interface VariableReplacementService {

    Mono<String> replaceValue(String variable);
}
