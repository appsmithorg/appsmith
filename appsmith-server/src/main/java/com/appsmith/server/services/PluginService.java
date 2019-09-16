package com.appsmith.server.services;

import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.PluginType;
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

    public Mono<Organization> installPlugin(PluginOrgDTO plugin);

    public Mono<Organization> uninstallPlugin(PluginOrgDTO plugin);

    public Mono<Plugin> findByName(String name);

    public Mono<Plugin> findById(String id);

}
