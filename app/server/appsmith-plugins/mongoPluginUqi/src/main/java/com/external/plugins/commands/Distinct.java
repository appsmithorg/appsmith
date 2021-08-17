package com.external.plugins.commands;

import com.appsmith.external.models.ActionConfiguration;
import com.external.plugins.constants.FieldName;
import lombok.Getter;
import lombok.Setter;
import org.bson.Document;
import org.pf4j.util.StringUtils;

import java.util.Map;

import static com.external.plugins.MongoPluginUtils.getValueSafely;
import static com.external.plugins.MongoPluginUtils.parseSafely;
import static com.external.plugins.MongoPluginUtils.validConfigurationPresent;
import static com.external.plugins.constants.FieldName.DISTINCT_QUERY;

@Getter
@Setter
public class Distinct extends MongoCommand {
    String query;
    String key;

    public Distinct(ActionConfiguration actionConfiguration) {
        super(actionConfiguration);

        Map<String, Object> formData = actionConfiguration.getFormData();

        if (validConfigurationPresent(formData, DISTINCT_QUERY)) {
            this.query = (String) getValueSafely(formData, DISTINCT_QUERY);
        }

        if (validConfigurationPresent(formData, FieldName.DISTINCT_KEY)) {
            this.key = (String) getValueSafely(formData, FieldName.DISTINCT_KEY);
        }
    }

    @Override
    public Boolean isValid() {
        if (super.isValid()) {
            if (!StringUtils.isNullOrEmpty(query) && !StringUtils.isNullOrEmpty(key)) {
                return Boolean.TRUE;
            } else {
                if (StringUtils.isNullOrEmpty(query)) {
                    fieldNamesWithNoConfiguration.add("Query");
                }
                if (StringUtils.isNullOrEmpty(key)) {
                    fieldNamesWithNoConfiguration.add("Key/Field");
                }
            }
        }

        return Boolean.FALSE;
    }

    @Override
    public Document parseCommand() {
        Document document = new Document();

        document.put("distinct", this.collection);

        document.put("query", parseSafely("Query", this.query));

        document.put("key", this.key);

        return document;
    }
}
