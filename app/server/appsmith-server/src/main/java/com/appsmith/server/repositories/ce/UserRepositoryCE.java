package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomUserRepository;
import reactor.core.publisher.Mono;

public interface UserRepositoryCE extends BaseRepository<User, String>, CustomUserRepository {

    Mono<User> findByEmail(String email);

    Mono<User> findByCaseInsensitiveEmail(String email);

    Mono<Long> countByDeletedAtNull();

}
