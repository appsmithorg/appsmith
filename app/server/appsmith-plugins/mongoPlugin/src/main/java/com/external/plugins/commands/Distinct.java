package com.external.plugins.commands;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.external.plugins.constants.FieldName;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import org.bson.Document;
import org.pf4j.util.StringUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.external.helpers.PluginUtils.getValueSafelyFromFormData;
import static com.external.plugins.utils.MongoPluginUtils.parseSafely;
import static com.appsmith.external.helpers.PluginUtils.setValueSafelyInFormData;
import static com.appsmith.external.helpers.PluginUtils.validConfigurationPresentInFormData;
import static com.external.plugins.constants.FieldName.DISTINCT_QUERY;
import static com.external.plugins.constants.FieldName.DISTINCT_KEY;
import static com.external.plugins.constants.FieldName.COLLECTION;
import static com.external.plugins.constants.FieldName.COMMAND;
import static com.external.plugins.constants.FieldName.SMART_SUBSTITUTION;
import static com.external.plugins.constants.FieldName.KEY;

@Getter
@Setter
@NoArgsConstructor
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


    @Override
    public List<DatasourceStructure.Template> generateTemplate(Map<String, Object> templateConfiguration) {
        Map<String, Object> configMap = new HashMap<>();
        String collectionName = (String) templateConfiguration.get("collectionName");

        setValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setValueSafelyInFormData(configMap, COMMAND, "DISTINCT");
        setValueSafelyInFormData(configMap, DISTINCT_QUERY, "{ \"_id\": ObjectId(\"id_of_document_to_distinct\") }");
        setValueSafelyInFormData(configMap, DISTINCT_KEY, "_id");
        setValueSafelyInFormData(configMap, COLLECTION, collectionName);
       

        String rawQuery = "{\n" +
        "  \"distinct\": \"" + collectionName + "\",\n" +
        "  \"query\": { \"_id\": ObjectId(\"id_of_document_to_distinct\") }," +
        "  \"key\": \"_id\"," +
        "}\n";



    return Collections.singletonList(new DatasourceStructure.Template(
        "Distinct",
        rawQuery,
        configMap
    ));
    }
}
