package com.external.plugins.commands;

import com.appsmith.external.models.ActionConfiguration;
import com.external.plugins.constants.FieldName;
import lombok.Getter;
import lombok.Setter;
import org.bson.Document;
import org.pf4j.util.StringUtils;

import java.util.Map;

import static com.appsmith.external.helpers.PluginUtils.getValueSafelyFromFormData;
import static com.external.plugins.utils.MongoPluginUtils.parseSafely;
import static com.appsmith.external.helpers.PluginUtils.validConfigurationPresentInFormData;
import static com.external.plugins.constants.FieldName.DISTINCT_QUERY;

@Getter
@Setter
public class Distinct extends MongoCommand {
    String query;
    String key;

    public Distinct(ActionConfiguration actionConfiguration) {
        super(actionConfiguration);

        Map<String, Object> formData = actionConfiguration.getFormData();

        if (validConfigurationPresentInFormData(formData, DISTINCT_QUERY)) {
            this.query = (String) getValueSafelyFromFormData(formData, DISTINCT_QUERY);
        }

        if (validConfigurationPresentInFormData(formData, FieldName.DISTINCT_KEY)) {
            this.key = (String) getValueSafelyFromFormData(formData, FieldName.DISTINCT_KEY);
        }
    }

    @Override
    public Boolean isValid() {
        if (super.isValid()) {
            if (!StringUtils.isNullOrEmpty(key)) {
                return Boolean.TRUE;
            } else if (StringUtils.isNullOrEmpty(key)) {
                    fieldNamesWithNoConfiguration.add("Key/Field");
            }
        }

        return Boolean.FALSE;
    }

    @Override
    public Document parseCommand() {
        Document document = new Document();

        document.put("distinct", this.collection);

        if (StringUtils.isNullOrEmpty(this.query)) {
            this.query = "{}";
        }

        document.put("query", parseSafely("Query", this.query));

        document.put("key", this.key);

        return document;
    }
}
