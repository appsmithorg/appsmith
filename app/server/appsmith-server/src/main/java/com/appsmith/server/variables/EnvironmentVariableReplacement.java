package com.appsmith.server.variables;

import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
public class EnvironmentVariableReplacement implements ServerSideVariableReplacement {

    @Override
    public Mono<String> replaceValue(String variable) {
        // To do read the environment variables in constructor
        return Mono.empty();
    }

}
