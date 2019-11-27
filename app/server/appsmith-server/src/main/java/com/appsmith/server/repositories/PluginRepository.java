package com.appsmith.server.repositories;

import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.PluginType;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface PluginRepository extends BaseRepository<Plugin, String> {
    Mono<Plugin> findByName(String name);

    Mono<Plugin> findById(String id);

    Flux<Plugin> findByType(PluginType pluginType);
}
