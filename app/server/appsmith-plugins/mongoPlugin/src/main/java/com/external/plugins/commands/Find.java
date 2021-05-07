package com.external.plugins.commands;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.Property;
import lombok.Getter;
import lombok.Setter;
import org.pf4j.util.StringUtils;

import java.util.List;

import static com.external.plugins.MongoPluginUtils.validConfigurationPresent;
import static com.external.plugins.constants.ConfigurationIndex.FIND_LIMIT;
import static com.external.plugins.constants.ConfigurationIndex.FIND_PROJECTION;
import static com.external.plugins.constants.ConfigurationIndex.FIND_QUERY;
import static com.external.plugins.constants.ConfigurationIndex.FIND_SKIP;
import static com.external.plugins.constants.ConfigurationIndex.FIND_SORT;

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

        if (validConfigurationPresent(pluginSpecifiedTemplates, FIND_QUERY)) {
            this.query = (String) pluginSpecifiedTemplates.get(FIND_QUERY).getValue();
        }

        if (validConfigurationPresent(pluginSpecifiedTemplates, FIND_SORT)) {
            this.sort = (String) pluginSpecifiedTemplates.get(FIND_SORT).getValue();
        }

        if (validConfigurationPresent(pluginSpecifiedTemplates, FIND_PROJECTION)) {
            this.projection = (String) pluginSpecifiedTemplates.get(FIND_PROJECTION).getValue();
        }

        if (validConfigurationPresent(pluginSpecifiedTemplates, FIND_LIMIT)) {
            this.limit = (String) pluginSpecifiedTemplates.get(FIND_LIMIT).getValue();
        }

        if (validConfigurationPresent(pluginSpecifiedTemplates, FIND_SKIP)) {
            this.skip = Long.parseLong((String) pluginSpecifiedTemplates.get(FIND_SKIP).getValue());
        }
    }

    @Override
    public Boolean isValid() {
        if (super.isValid()) {
            if (!StringUtils.isNullOrEmpty(query)) {
                return Boolean.TRUE;
            }
        }
        return Boolean.FALSE;
    }
}
