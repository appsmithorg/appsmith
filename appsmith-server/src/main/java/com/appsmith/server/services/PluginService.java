package com.appsmith.server.services;

import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.PluginType;
import com.appsmith.server.dtos.InstallPluginRedisDTO;
import com.appsmith.server.dtos.PluginOrgDTO;
import reactor.core.publisher.Mono;

public interface PluginService extends CrudService<Plugin, String> {

    /**
     * Return an instance of PluginExecutor based on the classname available.
     * If the classname is not available, null is returned.
     *
     * @param pluginType
     * @param className
     * @return PluginExecutor
     */
    OldPluginExecutor getPluginExecutor(PluginType pluginType, String className);

    Mono<Organization> installPlugin(PluginOrgDTO plugin);

    Mono<Organization> uninstallPlugin(PluginOrgDTO plugin);

    Mono<Plugin> findByName(String name);

    Mono<Plugin> findById(String id);

    Plugin redisInstallPlugin(InstallPluginRedisDTO installPluginRedisDTO);
}
