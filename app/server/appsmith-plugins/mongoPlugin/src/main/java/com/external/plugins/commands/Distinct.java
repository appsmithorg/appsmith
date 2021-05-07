package com.external.plugins.commands;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.Property;
import com.external.plugins.constants.ConfigurationIndex;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

import static com.external.plugins.MongoPluginUtils.validConfigurationPresent;

@Getter
@Setter
public class Distinct extends BaseCommand{
    String query;
    String key;

    Distinct(ActionConfiguration actionConfiguration) {
        super(actionConfiguration);

        List<Property> pluginSpecifiedTemplates = actionConfiguration.getPluginSpecifiedTemplates();

        if (validConfigurationPresent(pluginSpecifiedTemplates, ConfigurationIndex.DISTINCT_QUERY)) {
            this.query = (String) pluginSpecifiedTemplates.get(ConfigurationIndex.DISTINCT_QUERY).getValue();
        }

        if (validConfigurationPresent(pluginSpecifiedTemplates, ConfigurationIndex.DISTINCT_KEY)) {
            this.key = (String) pluginSpecifiedTemplates.get(ConfigurationIndex.DISTINCT_KEY).getValue();
        }
    }
}
