package com.external.plugins.commands;

import com.appsmith.external.helpers.PluginUtils;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.bson.Document;
import org.pf4j.util.StringUtils;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.external.helpers.PluginUtils.STRING_TYPE;
import static com.appsmith.external.helpers.PluginUtils.setDataValueSafelyInFormData;
import static com.appsmith.external.helpers.PluginUtils.validConfigurationPresentInFormData;
import static com.external.plugins.constants.FieldName.BODY;
import static com.external.plugins.constants.FieldName.COLLECTION;
import static com.external.plugins.constants.FieldName.COMMAND;
import static com.external.plugins.constants.FieldName.COUNT;
import static com.external.plugins.constants.FieldName.COUNT_QUERY;
import static com.external.plugins.constants.FieldName.SMART_SUBSTITUTION;
import static com.external.plugins.utils.MongoPluginUtils.parseSafely;

@Getter
@Setter
@NoArgsConstructor
public class Count extends MongoCommand {
    String query;

    public Count(ActionConfiguration actionConfiguration) {
        super(actionConfiguration);

        Map<String, Object> formData = actionConfiguration.getFormData();

        if (validConfigurationPresentInFormData(formData, COUNT_QUERY)) {
            this.query = PluginUtils.getDataValueSafelyFromFormData(formData, COUNT_QUERY, STRING_TYPE);
        }
    }

    @Override
    public Document parseCommand() {
        Document document = new Document();

        document.put(COUNT, this.collection);

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

        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(configMap, COMMAND, "COUNT");
        setDataValueSafelyInFormData(configMap, COUNT_QUERY, "{\"_id\": {\"$exists\": true}}");
        setDataValueSafelyInFormData(configMap, COLLECTION, collectionName);

        String rawQuery = "{\n" +
                "  \"count\": \"" + collectionName + "\",\n" +
                "  \"query\": " + "{\"_id\": {\"$exists\": true}} \n" +
                "}\n";
        setDataValueSafelyInFormData(configMap, BODY, rawQuery);

        return Collections.singletonList(new DatasourceStructure.Template(
                "Count",
                null,
                configMap
        ));
    }
}
