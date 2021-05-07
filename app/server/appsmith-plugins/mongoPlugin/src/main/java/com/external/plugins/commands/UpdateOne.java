package com.external.plugins.commands;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.Property;
import lombok.Getter;
import lombok.Setter;
import org.pf4j.util.StringUtils;

import java.util.List;

import static com.external.plugins.MongoPluginUtils.validConfigurationPresent;
import static com.external.plugins.constants.ConfigurationIndex.UPDATE_ONE_QUERY;
import static com.external.plugins.constants.ConfigurationIndex.UPDATE_ONE_SORT;
import static com.external.plugins.constants.ConfigurationIndex.UPDATE_ONE_UPDATE;

@Getter
@Setter
public class UpdateOne extends BaseCommand{
    String query;
    String sort;
    String update;

    UpdateOne(ActionConfiguration actionConfiguration) {
        super(actionConfiguration);

        List<Property> pluginSpecifiedTemplates = actionConfiguration.getPluginSpecifiedTemplates();

        if (validConfigurationPresent(pluginSpecifiedTemplates, UPDATE_ONE_QUERY)) {
            this.query = (String) pluginSpecifiedTemplates.get(UPDATE_ONE_QUERY).getValue();
        }

        if (validConfigurationPresent(pluginSpecifiedTemplates, UPDATE_ONE_SORT)) {
            this.sort = (String) pluginSpecifiedTemplates.get(UPDATE_ONE_SORT).getValue();
        }

        if (validConfigurationPresent(pluginSpecifiedTemplates, UPDATE_ONE_UPDATE)) {
            this.update = (String) pluginSpecifiedTemplates.get(UPDATE_ONE_UPDATE).getValue();
        }
    }

    @Override
    public Boolean isValid() {
        if (super.isValid()) {
            if (!StringUtils.isNullOrEmpty(query) && !StringUtils.isNullOrEmpty(update)) {
                return Boolean.TRUE;
            }
        }
        return Boolean.FALSE;
    }
}
