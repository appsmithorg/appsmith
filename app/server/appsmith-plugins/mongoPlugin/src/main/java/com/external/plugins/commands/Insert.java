package com.external.plugins.commands;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.Property;
import lombok.Getter;
import lombok.Setter;
import org.bson.Document;
import org.pf4j.util.StringUtils;

import java.util.List;

import static com.external.plugins.MongoPluginUtils.validConfigurationPresent;
import static com.external.plugins.constants.ConfigurationIndex.INSERT_DOCUMENT;

@Getter
@Setter
public class Insert extends BaseCommand{
    String documents;

    public Insert(ActionConfiguration actionConfiguration) {
        super(actionConfiguration);

        List<Property> pluginSpecifiedTemplates = actionConfiguration.getPluginSpecifiedTemplates();

        if (validConfigurationPresent(pluginSpecifiedTemplates, INSERT_DOCUMENT)) {
            this.documents = (String) pluginSpecifiedTemplates.get(INSERT_DOCUMENT).getValue();
        }
    }

    @Override
    public Boolean isValid() {
        if (super.isValid()) {
            if (!StringUtils.isNullOrEmpty(documents)) {
                return Boolean.TRUE;
            } else {
                fieldNamesWithNoConfiguration.add("Documents");
            }
        }
        return Boolean.FALSE;
    }

    @Override
    public Document parseCommand() {
        Document document = new Document();

        document.put("insert", this.collection);

        document.put("documents", documents);

        return document;
    }
}
