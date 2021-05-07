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
public class Find extends BaseCommand{
    String query;
    String sort;
    String projection;
    String limit;
    Long skip;

    Find(ActionConfiguration actionConfiguration) {
        super(actionConfiguration);

        List<Property> pluginSpecifiedTemplates = actionConfiguration.getPluginSpecifiedTemplates();

        if (validConfigurationPresent(pluginSpecifiedTemplates, ConfigurationIndex.FIND_QUERY)) {
            this.query = (String) pluginSpecifiedTemplates.get(ConfigurationIndex.FIND_QUERY).getValue();
        }

        if (validConfigurationPresent(pluginSpecifiedTemplates, ConfigurationIndex.FIND_SORT)) {
            this.sort = (String) pluginSpecifiedTemplates.get(ConfigurationIndex.FIND_SORT).getValue();
        }

        if (validConfigurationPresent(pluginSpecifiedTemplates, ConfigurationIndex.FIND_PROJECTION)) {
            this.projection = (String) pluginSpecifiedTemplates.get(ConfigurationIndex.FIND_PROJECTION).getValue();
        }

        if (validConfigurationPresent(pluginSpecifiedTemplates, ConfigurationIndex.FIND_LIMIT)) {
            this.limit = (String) pluginSpecifiedTemplates.get(ConfigurationIndex.FIND_LIMIT).getValue();
        }

        if (validConfigurationPresent(pluginSpecifiedTemplates, ConfigurationIndex.FIND_SKIP)) {
            this.skip = Long.parseLong((String) pluginSpecifiedTemplates.get(ConfigurationIndex.FIND_SKIP).getValue());
        }
    }
}
