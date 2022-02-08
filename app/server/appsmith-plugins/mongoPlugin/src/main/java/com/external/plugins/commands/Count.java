package com.external.plugins.commands;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceStructure;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import org.bson.Document;
import org.pf4j.util.StringUtils;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.external.helpers.PluginUtils.getValueSafelyFromFormData;
import static com.external.plugins.utils.MongoPluginUtils.parseSafely;
import static com.appsmith.external.helpers.PluginUtils.setValueSafelyInFormData;
import static com.appsmith.external.helpers.PluginUtils.validConfigurationPresentInFormData;
import static com.external.plugins.constants.FieldName.COUNT_QUERY;
import static com.external.plugins.constants.FieldName.SMART_SUBSTITUTION;
import static com.external.plugins.constants.FieldName.COLLECTION;
import static com.external.plugins.constants.FieldName.COMMAND;

@Getter
@Setter
@NoArgsConstructor
public class Count extends MongoCommand {
    String query;

    public Count(ActionConfiguration actionConfiguration) {
        super(actionConfiguration);

        Map<String, Object> formData = actionConfiguration.getFormData();

        if (validConfigurationPresentInFormData(formData, COUNT_QUERY)) {
            this.query = (String) getValueSafelyFromFormData(formData, COUNT_QUERY);
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

    @Override
    public List<DatasourceStructure.Template> generateTemplate(Map<String, Object> templateConfiguration) {
        String collectionName = (String) templateConfiguration.get("collectionName");

        Map<String, Object> configMap = new HashMap<>();

        setValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setValueSafelyInFormData(configMap, COMMAND, "COUNT");
        setValueSafelyInFormData(configMap, COUNT_QUERY, "{\"_id\": {\"$exists\": true}}");
        setValueSafelyInFormData(configMap, COLLECTION, collectionName);

        String rawQuery = "{\n" +
                "  \"count\": \"" + collectionName + "\",\n" +
                "  \"query\": " + "{\"_id\": {\"$exists\": true}} \n" +
                "}\n";

        return Collections.singletonList(new DatasourceStructure.Template(
                "Count",
                rawQuery,
                configMap
        ));
    }
}
