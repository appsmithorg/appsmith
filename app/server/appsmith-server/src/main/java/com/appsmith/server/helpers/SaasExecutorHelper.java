package com.appsmith.server.helpers;

import com.appsmith.external.plugins.PluginTransformer;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import org.pf4j.PluginManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
public class SaasExecutorHelper {

    private final PluginManager pluginManager;

    @Autowired
    public SaasExecutorHelper(PluginManager pluginManager) {
        this.pluginManager = pluginManager;
    }


}
