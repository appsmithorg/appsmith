package com.appsmith.server.services;

import com.appsmith.server.domains.Config;
import reactor.core.publisher.Mono;

public interface ConfigService extends CrudService<Config, String> {
    Mono<Config> getByName(String name);

    Mono<Config> updateByName(String name, Config config);
}
