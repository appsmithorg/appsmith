package com.appsmith.server.repositories;

import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.PluginType;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface PluginRepository extends BaseRepository<Plugin, String>, CustomPluginRepository {
    Mono<Plugin> findByName(String name);

    Mono<Plugin> findByPackageName(String packageName);

    Mono<Plugin> findById(String id);

    Flux<Plugin> findByDefaultInstall(Boolean isDefaultInstall);

    Flux<Plugin> findByType(PluginType pluginType);
}
