package com.appsmith.server.services;

import com.appsmith.server.variables.ServerSideVariable;
import com.appsmith.server.variables.EnvironmentVariableReplacement;
import com.appsmith.server.variables.ServerSideVariableReplacement;
import com.appsmith.server.variables.VariableReplacementFactory;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

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

}
