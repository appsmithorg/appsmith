package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomUserRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface UserRepositoryCE extends BaseRepository<User, String>, CustomUserRepository {

    Optional<User> findByEmail(String email);

    Optional<User> findFirstByEmailIgnoreCaseOrderByCreatedAtDesc(String email);

    List<User> findAllByEmailIn(Set<String> emails);

    Optional<Long> countByDeletedAtNull();

    /**
     * This method returns the count of all users that are not deleted and are not system generated.
     *
     * @param excludeSystemGenerated If true, then the count of all users that are not deleted and are not system
     *                               generated is returned.
     * @return  The count of all users that are not deleted and are not system generated.
     */
    Optional<Long> countByDeletedAtIsNullAndIsSystemGeneratedIsNot(Boolean excludeSystemGenerated);

    Optional<Long> countByDeletedAtIsNullAndLastActiveAtGreaterThanAndIsSystemGeneratedIsNot(
            Instant lastActiveAt, Boolean excludeSystemGenerated);
}
