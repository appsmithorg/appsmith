package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomUserRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface UserRepositoryCE extends BaseRepository<User, String>, CustomUserRepository {

    Optional<User> findByEmail(String email);

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<Long> countByDeletedAtNull();

    /**
     * This method returns the count of all users that are not deleted and are not system generated.
     *
     * @param excludeSystemGenerated If true, then the count of all users that are not deleted and are not system
     *                               generated is returned.
     * @return  The count of all users that are not deleted and are not system generated.
     */
    Optional<Long> countByDeletedAtIsNullAndIsSystemGeneratedIsNot(Boolean excludeSystemGenerated);

    Optional<User> findByEmailAndTenantId(String email, String tenantId);

    // There's _probably_ a better way to do this, but, problem for later.
    @Query("select count(u) = 0 from User u where u.email != 'anonymousUser'")
    Optional<Boolean> isUsersEmpty();
}
