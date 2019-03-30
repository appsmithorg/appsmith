package com.mobtools.server.services;

import com.mobtools.server.domains.Plugin;
import com.mobtools.server.domains.PluginType;

public interface PluginService extends CrudService<Plugin, String> {

    PluginExecutor getPluginExecutor(PluginType pluginType, String className);
}
