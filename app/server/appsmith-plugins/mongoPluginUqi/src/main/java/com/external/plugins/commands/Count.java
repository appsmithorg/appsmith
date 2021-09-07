package com.external.plugins.commands;

import com.appsmith.external.models.ActionConfiguration;
import lombok.Getter;
import lombok.Setter;
import org.bson.Document;
import org.pf4j.util.StringUtils;

import java.util.Map;

import static com.external.plugins.MongoPluginUtils.getValueSafely;
import static com.external.plugins.MongoPluginUtils.parseSafely;
import static com.external.plugins.MongoPluginUtils.validConfigurationPresent;
import static com.external.plugins.constants.FieldName.COUNT_QUERY;

@Getter
@Setter
public class Count extends MongoCommand {
    String query;

    public Count(ActionConfiguration actionConfiguration) {
        super(actionConfiguration);

        Map<String, Object> formData = actionConfiguration.getFormData();

        if (validConfigurationPresent(formData, COUNT_QUERY)) {
            this.query = (String) getValueSafely(formData, COUNT_QUERY);
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
