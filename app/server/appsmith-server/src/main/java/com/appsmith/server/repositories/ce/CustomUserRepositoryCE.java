package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.AppsmithRepository;
import org.springframework.data.mongodb.core.query.UpdateDefinition;
import reactor.core.publisher.Mono;

import java.util.Set;

public interface CustomUserRepositoryCE extends AppsmithRepository<User> {

    Mono<User> findByEmail(String email, AclPermission aclPermission);

    Mono<User> findByEmailAndTenantId(String email, String tenantId);

    Mono<Boolean> isUsersEmpty();

    Set<String> getSystemGeneratedUserEmails();

    Mono<Integer> updateById(String id, UpdateDefinition updateObj);
}
