package com.external.plugins.commands;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.Property;
import lombok.Getter;
import lombok.Setter;
import org.bson.Document;
import org.pf4j.util.StringUtils;

import java.util.List;

import static com.external.plugins.MongoPluginUtils.parseSafely;
import static com.external.plugins.MongoPluginUtils.validConfigurationPresent;
import static com.external.plugins.constants.ConfigurationIndex.COUNT_QUERY;

@Getter
@Setter
public class Count extends MongoCommand {
    String query;

    public Count(ActionConfiguration actionConfiguration) {
        super(actionConfiguration);

        List<Property> pluginSpecifiedTemplates = actionConfiguration.getPluginSpecifiedTemplates();

        if (validConfigurationPresent(pluginSpecifiedTemplates, COUNT_QUERY)) {
            this.query = (String) pluginSpecifiedTemplates.get(COUNT_QUERY).getValue();
        }
    }

    @Override
    public Boolean isValid() {
        if (super.isValid()) {
            if (!StringUtils.isNullOrEmpty(query)) {
                return Boolean.TRUE;
            } else {
                fieldNamesWithNoConfiguration.add("Query");
            }
        }
        return Boolean.FALSE;
    }

    @Override
    public Document parseCommand() {
        Document document = new Document();

        document.put("count", this.collection);

        document.put("query", parseSafely("Query", this.query));

        return document;
    }
}
