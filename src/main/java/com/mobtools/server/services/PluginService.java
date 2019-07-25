package com.mobtools.server.services;

import com.mobtools.server.domains.Plugin;
import com.mobtools.server.domains.PluginType;

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
}
