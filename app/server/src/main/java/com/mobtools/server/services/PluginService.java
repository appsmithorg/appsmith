package com.mobtools.server.services;

import com.mobtools.server.domains.Plugin;
import com.mobtools.server.domains.PluginType;
import com.mobtools.server.domains.Tenant;
import com.mobtools.server.dtos.PluginTenantDTO;
import com.mobtools.server.exceptions.MobtoolsException;
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
    PluginExecutor getPluginExecutor(PluginType pluginType, String className);

    public Mono<Plugin> create(Plugin plugin) throws MobtoolsException;

    public Mono<Tenant> installPlugin(PluginTenantDTO plugin);

    public Mono<Tenant> uninstallPlugin(PluginTenantDTO plugin);

}
