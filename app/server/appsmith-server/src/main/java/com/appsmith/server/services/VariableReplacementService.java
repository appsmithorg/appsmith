package com.appsmith.server.services;

import com.appsmith.external.models.AppsmithDomain;
import reactor.core.publisher.Mono;

public interface VariableReplacementService {

    Mono<String> replaceValue(String variable);

    Mono<AppsmithDomain> replaceAll(AppsmithDomain domain);
}
