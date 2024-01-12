package com.external.plugins.pluginActions.commands;

import com.external.plugins.pluginActions.PluginActions;

import java.net.URI;

public interface WorkflowCommand extends PluginActions {
    URI getExecutionUri();
}
