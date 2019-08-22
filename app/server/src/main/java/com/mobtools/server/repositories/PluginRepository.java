package com.mobtools.server.repositories;

import com.mobtools.server.domains.Plugin;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface PluginRepository extends BaseRepository<Plugin, String> {
    Mono<Plugin> findByName(String name);
}
