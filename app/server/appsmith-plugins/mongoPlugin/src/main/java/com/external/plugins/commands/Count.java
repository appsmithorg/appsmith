package com.external.plugins.commands;

import com.appsmith.external.models.ActionConfiguration;
import lombok.Getter;
import lombok.Setter;
import org.bson.Document;
import org.pf4j.util.StringUtils;

import java.util.Map;

import static com.appsmith.external.helpers.PluginUtils.getValueSafelyFromFormData;
import static com.external.plugins.utils.MongoPluginUtils.parseSafely;
import static com.appsmith.external.helpers.PluginUtils.validConfigurationPresentInFormData;
import static com.external.plugins.constants.FieldName.QUERY;

@Getter
@Setter
public class Count extends MongoCommand {
    String query;

    public Count(ActionConfiguration actionConfiguration) {
        super(actionConfiguration);

        Map<String, Object> formData = actionConfiguration.getFormData();

        if (validConfigurationPresentInFormData(formData, QUERY)) {
            this.query = (String) getValueSafelyFromFormData(formData, QUERY);
        }
    }

    @Override
    public Document parseCommand() {
        Document document = new Document();

        document.put("count", this.collection);

        if (StringUtils.isNullOrEmpty(this.query)) {
            this.query = "{}";
        }

        document.put("query", parseSafely("Query", this.query));

        return document;
    }
}
