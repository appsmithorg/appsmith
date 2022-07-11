package com.appsmith.external.plugins;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.pf4j.Plugin;
import org.pf4j.PluginWrapper;

import java.util.ArrayList;
import java.util.List;

public abstract class BasePlugin extends Plugin {

    protected static final ObjectMapper objectMapper = new ObjectMapper();

    public BasePlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

}
