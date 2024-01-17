package com.appsmith.server.repositories;

import com.appsmith.server.domains.UserData;
import com.appsmith.server.repositories.ce.UserDataRepositoryCE;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface UserDataRepository extends UserDataRepositoryCE, CustomUserDataRepository {

    Mono<UserData> findByUserId(String userId);
}
