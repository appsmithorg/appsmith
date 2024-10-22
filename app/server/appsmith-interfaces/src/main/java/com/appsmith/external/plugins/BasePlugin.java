package com.appsmith.external.plugins;

import com.appsmith.util.SerializationUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.pf4j.PluginWrapper;
import org.pf4j.spring.SpringPlugin;

public abstract class BasePlugin extends SpringPlugin {

    protected static final ObjectMapper objectMapper =
            SerializationUtils.getObjectMapperWithSourceInLocationAndMaxStringLengthEnabled();

    public BasePlugin(PluginWrapper wrapper) {
        super(wrapper);
    }
}
