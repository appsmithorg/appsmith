package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomUserRepository;
import reactor.core.publisher.Mono;

public interface UserRepositoryCE extends BaseRepository<User, String>, CustomUserRepository {

    Mono<User> findByEmail(String email);

    Mono<User> findByCaseInsensitiveEmail(String email);

    /**
     * This method returns the count of all users that are not deleted and are not system generated.
     *
     * @param excludeSystemGenerated If true, then the count of all users that are not deleted and are not system
     *                               generated is returned.
     * @return  The count of all users that are not deleted and are not system generated.
     */
    Mono<Long> countByDeletedAtIsNullAndIsSystemGeneratedIsNot(Boolean excludeSystemGenerated);

    Mono<User> findByEmailAndTenantId(String email, String tenantId);
}
