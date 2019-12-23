package com.appsmith.server.repositories;

import com.appsmith.server.domains.InviteUser;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface InviteUserRepository extends BaseRepository<InviteUser, String> {

    Mono<InviteUser> findByEmail(String email);
}
