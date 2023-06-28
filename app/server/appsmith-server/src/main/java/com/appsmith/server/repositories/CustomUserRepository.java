package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.ce.CustomUserRepositoryCE;
import reactor.core.publisher.Flux;

import java.util.Optional;

public interface CustomUserRepository extends CustomUserRepositoryCE {

    Flux<String> getAllUserEmail(String defaultTenantId);

    Flux<User> getAllUserObjectsWithEmail(String defaultTenantId, Optional<AclPermission> aclPermission);
}
