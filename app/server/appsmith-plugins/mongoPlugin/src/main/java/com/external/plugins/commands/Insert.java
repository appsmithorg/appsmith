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
public class Insert extends BaseCommand{
    String documents;

    Insert(ActionConfiguration actionConfiguration) {
        super(actionConfiguration);

        List<Property> pluginSpecifiedTemplates = actionConfiguration.getPluginSpecifiedTemplates();

        if (validConfigurationPresent(pluginSpecifiedTemplates, ConfigurationIndex.INSERT_DOCUMENT)) {
            this.documents = (String) pluginSpecifiedTemplates.get(ConfigurationIndex.INSERT_DOCUMENT).getValue();
        }
    }
}
