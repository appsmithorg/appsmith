package com.appsmith.server.repositories;

import com.appsmith.server.constants.AclConstants;
import com.appsmith.server.domains.User;
import com.appsmith.server.services.AclEntity;
import com.appsmith.server.services.AclPermission;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
@AclEntity("users")
public interface UserRepository extends BaseRepository<User, String> {

    @AclPermission(values = AclConstants.READ_PERMISSION)
    Mono<User> findByEmail(String email);
}
