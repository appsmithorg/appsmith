package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.InviteUser;
import com.appsmith.server.repositories.BaseRepository;
import reactor.core.publisher.Mono;

public interface InviteUserRepositoryCE extends BaseRepository<InviteUser, String> {

    Mono<InviteUser> findByEmail(String email);
}
