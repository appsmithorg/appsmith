package com.mobtools.server.repositories;

import com.mobtools.server.domains.User;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface UserRepository extends BaseRepository<User, String> {

    Mono<User> findByName(String name);
}
