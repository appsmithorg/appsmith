package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.AppsmithRepository;
import org.springframework.data.mongodb.core.query.UpdateDefinition;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface CustomUserRepositoryCE extends AppsmithRepository<User> {

    Mono<User> findByEmailAndOrganizationId(String email, String organizationId);

    Mono<Boolean> isUsersEmpty();

    Flux<String> getSystemGeneratedUserEmails(String organizationId);

    Mono<Integer> updateById(String id, UpdateDefinition updateObj);
}
