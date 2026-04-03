package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.AppsmithRepository;
import org.springframework.data.mongodb.core.query.UpdateDefinition;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface CustomUserRepositoryCE extends AppsmithRepository<User> {

    Mono<User> findByEmailAndOrganizationId(String email, String organizationId);

    Mono<Boolean> isUsersEmpty();

    /**
     * Atomically claims the super user creation slot using MongoDB's findAndModify with upsert.
     * Only the first caller wins — subsequent callers see the existing sentinel document and are rejected.
     * This eliminates the TOCTOU race condition in the super user creation flow.
     *
     * @return Mono<Boolean> — true if this caller successfully claimed the slot, false otherwise.
     */
    Mono<Boolean> claimSuperUserCreationSlot();

    /**
     * Releases a previously claimed super user creation slot by removing the sentinel document.
     * Called when the super user creation flow fails after claiming the slot, so that a subsequent
     * legitimate attempt can succeed.
     */
    Mono<Void> releaseSuperUserCreationSlot();

    Flux<String> getSystemGeneratedUserEmails(String organizationId);

    Mono<Integer> updateById(String id, UpdateDefinition updateObj);
}
