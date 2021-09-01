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
import static com.external.plugins.constants.ConfigurationIndex.UPDATE_ONE_QUERY;
import static com.external.plugins.constants.ConfigurationIndex.UPDATE_ONE_SORT;
import static com.external.plugins.constants.ConfigurationIndex.UPDATE_ONE_UPDATE;

@Getter
@Setter
@Deprecated
public class UpdateOne extends MongoCommand {
    String query;
    String sort;
    String update;

    public UpdateOne(ActionConfiguration actionConfiguration) {
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
            } else {
                if (StringUtils.isNullOrEmpty(query)) {
                    fieldNamesWithNoConfiguration.add("Query");
                }
                if (StringUtils.isNullOrEmpty(update)) {
                    fieldNamesWithNoConfiguration.add("Update");
                }
            }
        }
        return Boolean.FALSE;
    }

    @Override
    public Document parseCommand() {
        Document document = new Document();

        document.put("findAndModify", this.collection);

        document.put("query", parseSafely("Query", this.query));

        if (!StringUtils.isNullOrEmpty(this.sort)) {
            document.put("sort", parseSafely("Sort", this.sort));
        }

        document.put("update", parseSafely("Update", this.update));

        // Return the newly modified document
        document.put("new", Boolean.TRUE);

        return document;
    }
}
