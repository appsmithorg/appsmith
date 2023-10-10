package com.appsmith.server.services;

import com.appsmith.server.domains.LoginSource;
import com.appsmith.server.services.ce_compatible.UserServiceCECompatible;
import reactor.core.publisher.Mono;

public interface UserService extends UserServiceCECompatible {

    Mono<Boolean> makeUserPristineBasedOnLoginSource(LoginSource loginSource, String tenantId);
}
