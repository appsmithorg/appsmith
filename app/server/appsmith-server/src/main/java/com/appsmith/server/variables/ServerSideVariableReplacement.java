package com.appsmith.server.variables;

import reactor.core.publisher.Mono;

public interface ServerSideVariableReplacement {

    Mono<String> replaceValue(String variable);
    
}
