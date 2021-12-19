package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Config;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomConfigRepository;
import reactor.core.publisher.Mono;

public interface ConfigRepositoryCE extends BaseRepository<Config, String>, CustomConfigRepository {

    Mono<Config> findByName(String name);
}
