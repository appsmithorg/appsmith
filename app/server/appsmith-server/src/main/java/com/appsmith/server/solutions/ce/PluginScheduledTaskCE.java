package com.appsmith.server.solutions.ce;

/**
 * This class represents a scheduled task that pings cloud services for any updates in available plugins.
 */
public interface PluginScheduledTaskCE {

    public void updateRemotePlugins();

}
