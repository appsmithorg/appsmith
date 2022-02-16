package com.appsmith.server.variables;

import lombok.Getter;

@Getter
public enum ServerSideVariable {

    APPSMITH_USER_OAUTH2_TOKEN(UserDataVariableReplacement.class);

    private final Class<? extends ServerSideVariableReplacement> variable;

    ServerSideVariable(Class<? extends ServerSideVariableReplacement> variableClass) {
        this.variable = variableClass;
    }
}
