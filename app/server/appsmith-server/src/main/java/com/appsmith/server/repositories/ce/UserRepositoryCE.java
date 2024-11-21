package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomUserRepository;
import jakarta.persistence.EntityManager;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface UserRepositoryCE extends BaseRepository<User, String>, CustomUserRepository {

    Optional<User> findByEmail(String email, EntityManager entityManager);

    Optional<User> findFirstByEmailIgnoreCaseOrderByCreatedAtDesc(String email, EntityManager entityManager);

    List<User> findAllByEmailIn(Set<String> emails, EntityManager entityManager);

    Optional<Long> countByDeletedAtNull(EntityManager entityManager);

    /**
     * This method returns the count of all users that are not deleted and are not system generated.
     *
     * @param excludeSystemGenerated If true, then the count of all users that are not deleted and are not system
     *                               generated is returned.
     * @return  The count of all users that are not deleted and are not system generated.
     */
    Optional<Long> countByDeletedAtIsNullAndIsSystemGeneratedIsNot(
            Boolean excludeSystemGenerated, EntityManager entityManager);

    Optional<Long> countByDeletedAtIsNullAndLastActiveAtGreaterThanAndIsSystemGeneratedIsNot(
            Instant lastActiveAt, Boolean excludeSystemGenerated, EntityManager entityManager);

    Optional<User> findByEmailAndTenantId(String email, String tenantId, EntityManager entityManager);
}
