package com.appsmith.server.services;

import com.appsmith.external.models.AppsmithDomain;
import com.appsmith.server.helpers.AngularHelper;
import com.appsmith.server.variables.EnvironmentVariableReplacement;
import com.appsmith.server.variables.ServerSideVariable;
import com.appsmith.server.variables.ServerSideVariableReplacement;
import com.appsmith.server.variables.VariableReplacementFactory;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Component
public class VariableReplacementServiceImpl implements VariableReplacementService {

    private final VariableReplacementFactory factory;

    public VariableReplacementServiceImpl(VariableReplacementFactory factory) {
        this.factory = factory;
    }

    @Override
    public Mono<String> replaceValue(String variable) {
        try {
            // First find and replace all the known predefined server side variables.
            ServerSideVariable variableEnum = Enum.valueOf(ServerSideVariable.class, variable);
            ServerSideVariableReplacement replacement = factory.getInstance(variableEnum.getVariable());
            return replacement.replaceValue(variable);
        } catch (IllegalArgumentException e) {
            // Now handle all the user defined dynamic server side variables.

            EnvironmentVariableReplacement replacement = new EnvironmentVariableReplacement();
            return replacement.replaceValue(variable);
        }
    }

    @Override
    public Mono<AppsmithDomain> replaceAll(AppsmithDomain domain) {
        Set<String> variables = AngularHelper.extractAngularKeysFromFields(domain);

        if (variables.isEmpty()) {
            return Mono.just(domain);
        }

        Map<String, String> replacementMap = new HashMap<>();
        return Flux.fromIterable(variables)
                .flatMap(variable -> {
                    Mono<String> replacedValueMono = this.replaceValue(variable).cache();

                    return replacedValueMono
                            .map(value -> Boolean.TRUE)
                            .switchIfEmpty(Mono.just(Boolean.FALSE))
                            .flatMap(bool -> {
                                // We have successfully managed to find a replacement for the variable
                                if (bool.equals(Boolean.TRUE)) {
                                    return replacedValueMono.map(value -> {
                                        replacementMap.put(variable, value);
                                        return Boolean.TRUE;
                                    });
                                }

                                return Mono.just(Boolean.FALSE);
                            });
                })
                .then(Mono.just(replacementMap))
                .map(finalMap -> AngularHelper.renderFieldValues(domain, finalMap));
    }
}
