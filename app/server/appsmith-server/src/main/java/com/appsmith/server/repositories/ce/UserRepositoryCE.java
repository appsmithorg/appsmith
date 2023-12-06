package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomUserRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface UserRepositoryCE extends BaseRepository<User, String>, CustomUserRepository {

    Optional<User> findByEmail(String email);

    Optional<User> findByCaseInsensitiveEmail(String email);

    Optional<Long> countByDeletedAtNull();

    Optional<User> findByEmailAndTenantId(String email, String tenantId);

    // There's _probably_ a better way to do this, but, problem for later.
    @Query("select count(u) = 0 from User u where u.email != com.appsmith.server.constants.FieldName.ANONYMOUS_USER")
    Optional<Boolean> isUsersEmpty();
}
