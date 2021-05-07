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
public class UpdateOne extends BaseCommand{
    String query;
    String sort;
    String update;

    UpdateOne(ActionConfiguration actionConfiguration) {
        super(actionConfiguration);

        List<Property> pluginSpecifiedTemplates = actionConfiguration.getPluginSpecifiedTemplates();

        if (validConfigurationPresent(pluginSpecifiedTemplates, ConfigurationIndex.UPDATE_ONE_QUERY)) {
            this.query = (String) pluginSpecifiedTemplates.get(ConfigurationIndex.UPDATE_ONE_QUERY).getValue();
        }

        if (validConfigurationPresent(pluginSpecifiedTemplates, ConfigurationIndex.UPDATE_ONE_SORT)) {
            this.sort = (String) pluginSpecifiedTemplates.get(ConfigurationIndex.UPDATE_ONE_SORT).getValue();
        }

        if (validConfigurationPresent(pluginSpecifiedTemplates, ConfigurationIndex.UPDATE_ONE_UPDATE)) {
            this.update = (String) pluginSpecifiedTemplates.get(ConfigurationIndex.UPDATE_ONE_UPDATE).getValue();
        }
    }
}
