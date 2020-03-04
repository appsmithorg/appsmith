package com.appsmith.server.repositories;

import com.appsmith.server.domains.User;
import com.appsmith.server.services.AclEntity;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
@AclEntity("users")
public interface UserRepository extends BaseRepository<User, String> {

    Mono<User> findByEmail(String email);
}
