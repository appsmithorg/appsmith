package com.appsmith.server.variables;

import com.appsmith.server.services.UserDataService;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
public class UserDataVariableReplacement implements ServerSideVariableReplacement {

    private final UserDataService userDataService;

    public UserDataVariableReplacement(UserDataService userDataService) {
        this.userDataService = userDataService;
    }

    @Override
    public Mono<String> replaceValue(String variable) {
        try {

            ServerSideVariable userDataVariableType = Enum.valueOf(ServerSideVariable.class, variable);

            return userDataService
                    .getForCurrentUser()
                    .flatMap(userData -> {
                        switch (userDataVariableType) {
                            case APPSMITH_USER_OAUTH2_TOKEN:
                                return Mono.just(userData.getAccessToken());
                            default:
                                break;
                        }

                        return Mono.empty();
                    });

        } catch (IllegalArgumentException e) {
            return Mono.empty();
        }
    }

}
