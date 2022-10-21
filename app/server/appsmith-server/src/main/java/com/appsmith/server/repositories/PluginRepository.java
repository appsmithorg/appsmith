package com.appsmith.server.repositories;

import com.appsmith.server.domains.Plugin;
import com.appsmith.server.repositories.ce.PluginRepositoryCE;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface PluginRepository extends PluginRepositoryCE, CustomPluginRepository {
    Mono<Plugin> findByPluginNameAndPackageNameAndVersion(String pluginName, String packageName, String version);
}
