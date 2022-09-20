package com.appsmith.server.services.ce;

import reactor.core.publisher.Mono;

import java.util.List;

public interface AstServiceCE {

    Mono<List<String>> getPossibleReferencesFromDynamicBinding(String bindingValue, int evalVersion);
}
