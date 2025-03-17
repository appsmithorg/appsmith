package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.AppsmithRepository;
import org.springframework.data.mongodb.core.query.UpdateDefinition;
import reactor.core.publisher.Mono;

import java.util.Set;

public interface CustomUserRepositoryCE extends AppsmithRepository<User> {

    Mono<User> findByEmailAndOrganizationId(String email, String organizationId);

    Mono<Boolean> isUsersEmpty();

    Set<String> getSystemGeneratedUserEmails();

    Mono<Integer> updateById(String id, UpdateDefinition updateObj);
}
