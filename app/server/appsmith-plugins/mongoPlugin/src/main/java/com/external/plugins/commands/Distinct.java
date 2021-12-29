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
import static org.apache.commons.lang3.StringUtils.isBlank;

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

    /**
     * This method coverts Mongo plugin's form inputs to Mongo's native query. Currently, it is meant to help users
     * switch easily from form based input to raw input mode by providing a readily available translation of the form
     * data to raw query.
     * The `parseCommand` method defined in this class could not be used since it tries to parse and validate the form
     * data and fails if the data is bad or if it contains mustache binding. However, this is not the desired behavior
     * wrt the use case this method is intended to solve i.e. we should be able to covert the form data to raw query
     * irrespective of whether the data provided by the user is valid or not since we are not trying to execute it
     * immediately.
     * When writing this method the following two alternative implementations were also considered - using JSONObject
     * and JsonNode. The issue with JSONObject is that it does not maintain the keys in order, which causes the final
     * query to fail since order of keys is essential - e.g. `find` must be the first key in the native query for
     * Mongo to recognize it as a valid command. JsonNode could not be used because it would enclose all values
     * inside double quotes - which is not a true translation of what the user might have fed into the form.
     * @return : Mongo's native query
     */
    @Override
    public String getRawQuery() {
        StringBuilder sb = new StringBuilder();
        sb.append("{\n");
        sb.append("  \"distinct\": \"" + this.collection + "\",\n");

        String query = "{}";
        if (!isBlank(this.query)) {
            query = this.query;
        }
        sb.append("  \"query\": " + query + ",\n");
        sb.append("  \"key\": \"" + this.key + "\"\n");
        sb.append("}\n");

        return sb.toString();
    }
}
