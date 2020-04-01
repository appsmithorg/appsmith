package com.appsmith.server.repositories;

import com.appsmith.server.domains.Config;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface ConfigRepository extends BaseRepository<Config, String>, CustomConfigRepository {

    Mono<Config> findByName(String name);
}
