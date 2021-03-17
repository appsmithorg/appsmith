package com.appsmith.server.repositories;

import com.appsmith.server.domains.UserData;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface UserDataRepository extends BaseRepository<UserData, String>, CustomUserDataRepository {

    Mono<UserData> findByUserId(String userId);

}
