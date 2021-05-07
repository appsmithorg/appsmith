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
public class Delete extends BaseCommand{
    String query;

    Delete(ActionConfiguration actionConfiguration) {
        super(actionConfiguration);

        List<Property> pluginSpecifiedTemplates = actionConfiguration.getPluginSpecifiedTemplates();

        if (validConfigurationPresent(pluginSpecifiedTemplates, ConfigurationIndex.DELETE_QUERY)) {
            this.query = (String) pluginSpecifiedTemplates.get(ConfigurationIndex.DELETE_QUERY).getValue();
        }
    }
}
