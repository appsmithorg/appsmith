package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.User;
import reactor.core.publisher.Mono;

public interface CustomUserRepository extends AppsmithRepository<User> {

    Mono<User> findByEmail(String email, AclPermission aclPermission);

    Mono<User> findByCaseInsensitiveEmail(String email);

    Mono<Boolean> isUsersEmpty();

}
