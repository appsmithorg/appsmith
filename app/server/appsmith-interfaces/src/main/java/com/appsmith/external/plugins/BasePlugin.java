package com.appsmith.external.plugins;

import com.fasterxml.jackson.core.StreamReadFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.pf4j.Plugin;
import org.pf4j.PluginWrapper;

public abstract class BasePlugin extends Plugin {

    protected static final ObjectMapper objectMapper =
            new ObjectMapper().enable(StreamReadFeature.INCLUDE_SOURCE_IN_LOCATION.mappedFeature());

    public BasePlugin(PluginWrapper wrapper) {
        super(wrapper);
    }
}
