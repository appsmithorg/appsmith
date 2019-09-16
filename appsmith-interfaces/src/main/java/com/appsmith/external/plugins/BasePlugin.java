package com.appsmith.external.plugins;

import org.pf4j.Plugin;
import org.pf4j.PluginWrapper;

public abstract class BasePlugin extends Plugin {

    public BasePlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

}
