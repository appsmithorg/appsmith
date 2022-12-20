package com.appsmith.server.variables;

import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import org.springframework.stereotype.Component;

@Component
public class VariableReplacementFactory {

    private final EnvironmentVariableReplacement environmentVariableReplacement;
    private final UserDataVariableReplacement userDataVariableReplacement;

    public VariableReplacementFactory(EnvironmentVariableReplacement environmentVariableReplacement,
                                      UserDataVariableReplacement userDataVariableReplacement) {

        this.environmentVariableReplacement = environmentVariableReplacement;
        this.userDataVariableReplacement = userDataVariableReplacement;
    }

    public ServerSideVariableReplacement getInstance(Class clazz) {
        if (clazz.equals(EnvironmentVariableReplacement.class)) {
            return environmentVariableReplacement;
        } else if (clazz.equals(UserDataVariableReplacement.class)) {
            return userDataVariableReplacement;
        }

        // If the clazz is none of the above, throw an exception.
        throw new AppsmithException(AppsmithError.UNKNOWN_SERVER_VARIABLE_TYPE);

    }
}
