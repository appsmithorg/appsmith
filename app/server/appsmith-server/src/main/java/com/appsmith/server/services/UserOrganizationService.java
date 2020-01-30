package com.appsmith.server.services;

import com.appsmith.server.domains.User;
import reactor.core.publisher.Mono;

public interface UserOrganizationService {
    Mono<User> addUserToOrganization(String orgId, User user);
}
