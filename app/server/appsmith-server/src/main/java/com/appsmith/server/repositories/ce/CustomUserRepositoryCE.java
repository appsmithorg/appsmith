package com.appsmith.server.repositories.ce;

import java.util.Set;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.AppsmithRepository;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface CustomUserRepositoryCE extends AppsmithRepository<User> {

    Mono<User> findByEmail(String email, AclPermission aclPermission);

    Flux<User> findAllByEmails(Set<String> emails, AclPermission aclPermission);

    Mono<User> findByCaseInsensitiveEmail(String email);

    Mono<Boolean> isUsersEmpty();

}
