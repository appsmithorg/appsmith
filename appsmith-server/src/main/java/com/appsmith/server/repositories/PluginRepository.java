package com.appsmith.server.repositories;

import com.appsmith.server.domains.Plugin;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface PluginRepository extends BaseRepository<Plugin, String> {
    Mono<Plugin> findByName(String name);

    Mono<Plugin> findById(String id);
}
