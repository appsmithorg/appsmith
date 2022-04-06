package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.UserData;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomUserDataRepository;
import reactor.core.publisher.Mono;

public interface UserDataRepositoryCE extends BaseRepository<UserData, String>, CustomUserDataRepository {

    Mono<UserData> findByUserId(String userId);

}
