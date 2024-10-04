package com.appsmith.external.plugins;

import com.appsmith.util.SerializationUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.pf4j.Plugin;
import org.pf4j.PluginWrapper;

public abstract class BasePlugin extends Plugin {

    protected static final ObjectMapper objectMapper =
            SerializationUtils.getObjectMapperWithSourceInLocationAndMaxStringLengthEnabled();

    public BasePlugin(PluginWrapper wrapper) {
        super(wrapper);
    }
}
