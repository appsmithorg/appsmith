package com.external.plugins.commands;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.external.plugins.constants.FieldName;
import lombok.Getter;
import lombok.Setter;
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
import static com.external.plugins.constants.FieldName.COLLECTION;
import static com.external.plugins.constants.FieldName.COMMAND;
import static com.external.plugins.constants.FieldName.SMART_SUBSTITUTION;
import static com.external.plugins.constants.FieldName.KEY;

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

    @Override
    public List<DatasourceStructure.Template> generateTemplate(Map<String, Object> templateConfiguration) {
        String collectionName = (String) templateConfiguration.get("collectionName");
        String key = (String) templateConfiguration.get("key");

        List<DatasourceStructure.Template> templates = new ArrayList<>();

        templates.add(generateQueryTemplate(collectionName));

        templates.add(generateKeyTemplate(collectionName, key));

        return templates;
    }
    

    private DatasourceStructure.Template generateKeyTemplate(String collectionName, String key) {
        Map<String, Object> configMap = new HashMap<>();

        setValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setValueSafelyInFormData(configMap, COMMAND, "DISTINCT");
        setValueSafelyInFormData(configMap, COLLECTION, collectionName);
        setValueSafelyInFormData(configMap, KEY, key);

        String rawQuery = "{\n" +
                "  \"distinct\": \"" + collectionName + "." + key + "\",\n" +
                "}\n";


        return new DatasourceStructure.Template(
            "Distinct",
            rawQuery,
            configMap
        );
    }

    private DatasourceStructure.Template generateQueryTemplate(String collectionName) {
        Map<String, Object> configMap = new HashMap<>();

        setValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setValueSafelyInFormData(configMap, COMMAND, "DISTINCT");
        setValueSafelyInFormData(configMap, DISTINCT_QUERY, "{ \"_id\": ObjectId(\"id_of_document_to_distinct\") }");
        setValueSafelyInFormData(configMap, COLLECTION, collectionName);
       

        String rawQuery = "{\n" +
        "  \"distinct\": \"" + collectionName + "\",\n" +
        "  \"distincts\": [\n" +
        "    {\n" +
        "      \"q\": {\n" +
        "        \"_id\": \"id_of_document_to_distinct\"\n" +
        "      },\n" +
        "    }\n" +
        "  ]\n" +
        "}\n";


        return new DatasourceStructure.Template(
            "Distinct",
            rawQuery,
            configMap
        );
    }
}
