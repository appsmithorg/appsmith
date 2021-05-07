package com.external.plugins.commands;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.Property;
import org.pf4j.util.StringUtils;

import java.util.List;

import static com.external.plugins.MongoPluginUtils.validConfigurationPresent;
import static com.external.plugins.constants.ConfigurationIndex.COLLECTION;

public abstract class BaseCommand {
    String collection;

    BaseCommand(ActionConfiguration actionConfiguration) {
        List<Property> pluginSpecifiedTemplates = actionConfiguration.getPluginSpecifiedTemplates();

        if (validConfigurationPresent(pluginSpecifiedTemplates, COLLECTION)) {
            this.collection = (String) pluginSpecifiedTemplates.get(COLLECTION).getValue();
        }
    }

    public Boolean isValid() {
        if (StringUtils.isNullOrEmpty(this.collection)) {
            return Boolean.FALSE;
        }
        return Boolean.TRUE;
    }
}
