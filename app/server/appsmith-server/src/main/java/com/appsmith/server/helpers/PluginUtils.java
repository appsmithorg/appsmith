package com.appsmith.server.helpers;

import com.appsmith.server.domains.Plugin;

import java.util.Optional;

public class PluginUtils {
    /**
     * This function will extract plugin name from the plugin object
     * @param plugin plugin object
     * @return plugin name
     */
    public static String getPluginName(Plugin plugin) {
        return Optional.ofNullable(plugin.getPluginName()).orElse(plugin.getPackageName());
    }
}
