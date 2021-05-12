package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.Property;
import com.external.plugins.constants.ConfigurationIndex;
import org.bson.Document;
import org.bson.json.JsonParseException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class MongoPluginUtils {

    public static Boolean validConfigurationPresent(List<Property> pluginSpecifiedTemplates, int index) {
        if (pluginSpecifiedTemplates != null) {
            if (pluginSpecifiedTemplates.size()>index) {
                if (pluginSpecifiedTemplates.get(index) != null) {
                    if (pluginSpecifiedTemplates.get(index).getValue() != null) {
                        return Boolean.TRUE;
                    }
                }
            }
        }

        return Boolean.FALSE;
    }

    public static Document parseSafely(String fieldName, String input) {
        try {
            return Document.parse(input);
        } catch (JsonParseException e) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, fieldName + " could not be parsed into expected JSON format." );
        }
    }

    public static List<Property> generateMongoFormConfigTemplates(Map<Integer, Object> configuration) {
        List<Property> templates = new ArrayList<>();
        for (int i=0; i<21; i++) {
            Property template = new Property();
            if (configuration.containsKey(i)) {
                template.setValue(configuration.get(i));
            }
            templates.add(template);
        }
        return templates;
    }

    public static DatasourceStructure.Template generateFindTemplate(String collectionName, String filterFieldName, String filterFieldValue) {
        Map<Integer, Object> configMap = new HashMap<>();

        configMap.put(ConfigurationIndex.BSON, Boolean.FALSE);
        configMap.put(ConfigurationIndex.INPUT_TYPE, "FORM");
        configMap.put(ConfigurationIndex.COMMAND, "FIND");
        configMap.put(ConfigurationIndex.COLLECTION, collectionName);
        configMap.put(ConfigurationIndex.FIND_SORT, "{\"_id\": 1}");
        configMap.put(ConfigurationIndex.FIND_LIMIT, "10");

        String query = filterFieldName == null ? "{}" :
               "{ \"" + filterFieldName +"\": \"" + filterFieldValue + "\"}";
        configMap.put(ConfigurationIndex.FIND_QUERY, query);

        List<Property> pluginSpecifiedTemplates = generateMongoFormConfigTemplates(configMap);

        String rawQuery = "{\n" +
                "  \"find\": \"" + collectionName + "\",\n" +
                (
                        filterFieldName == null ? "" :
                                "  \"filter\": {\n" +
                                        "    \"" + filterFieldName + "\": \"" + filterFieldValue + "\"\n" +
                                        "  },\n"
                ) +
                "  \"sort\": {\n" +
                "    \"_id\": 1\n" +
                "  },\n" +
                "  \"limit\": 10\n" +
                "}\n";

        return new DatasourceStructure.Template(
                "Find",
                rawQuery,
                pluginSpecifiedTemplates
        );
    }

    public static DatasourceStructure.Template generateFindByIdTemplate(String collectionName) {
        Map<Integer, Object> configMap = new HashMap<>();

        configMap.put(ConfigurationIndex.BSON, Boolean.FALSE);
        configMap.put(ConfigurationIndex.INPUT_TYPE, "FORM");
        configMap.put(ConfigurationIndex.COMMAND, "FIND");
        configMap.put(ConfigurationIndex.FIND_QUERY, "{\"_id\": ObjectId(\"id_to_query_with\")}");
        configMap.put(ConfigurationIndex.COLLECTION, collectionName);

        List<Property> pluginSpecifiedTemplates = generateMongoFormConfigTemplates(configMap);

        String rawQuery = "{\n" +
                "  \"find\": \"" + collectionName + "\",\n" +
                "  \"filter\": {\n" +
                "    \"_id\": ObjectId(\"id_to_query_with\")\n" +
                "  }\n" +
                "}\n";

        return new DatasourceStructure.Template(
                "Find by ID",
                rawQuery,
                pluginSpecifiedTemplates
        );
    }

    public static DatasourceStructure.Template generateInsertTemplate(String collectionName, Map<String, String> sampleInsertValues) {
        String sampleInsertDocuments = sampleInsertValues.entrySet().stream()
                .map(entry -> "      \"" + entry.getKey() + "\": " + entry.getValue() + ",\n")
                .sorted()
                .collect(Collectors.joining(""));

        Map<Integer, Object> configMap = new HashMap<>();

        configMap.put(ConfigurationIndex.BSON, Boolean.FALSE);
        configMap.put(ConfigurationIndex.INPUT_TYPE, "FORM");
        configMap.put(ConfigurationIndex.COMMAND, "INSERT");
        configMap.put(ConfigurationIndex.INSERT_DOCUMENT, "[{" + sampleInsertDocuments + "}]");
        configMap.put(ConfigurationIndex.COLLECTION, collectionName);

        List<Property> pluginSpecifiedTemplates = generateMongoFormConfigTemplates(configMap);

        String rawQuery = "{\n" +
                "  \"insert\": \"" + collectionName + "\",\n" +
                "  \"documents\": [\n" +
                "    {\n" +
                        sampleInsertDocuments +
                "    }\n" +
                "  ]\n" +
                "}\n";

        return new DatasourceStructure.Template(
                "Insert",
                rawQuery,
                pluginSpecifiedTemplates
        );

    }

    public static DatasourceStructure.Template generateUpdateTemplate(String collectionName, String filterFieldName) {
        Map<Integer, Object> configMap = new HashMap<>();

        configMap.put(ConfigurationIndex.BSON, Boolean.FALSE);
        configMap.put(ConfigurationIndex.INPUT_TYPE, "FORM");
        configMap.put(ConfigurationIndex.COMMAND, "UPDATE_MANY");
        configMap.put(ConfigurationIndex.COLLECTION, collectionName);
        configMap.put(ConfigurationIndex.UPDATE_MANY_QUERY, "{ \"_id\": ObjectId(\"id_of_document_to_update\") }");
        configMap.put(ConfigurationIndex.UPDATE_MANY_UPDATE, "{ \"$set\": { \"" + filterFieldName + "\": \"new value\" } }");

        List<Property> pluginSpecifiedTemplates = generateMongoFormConfigTemplates(configMap);

        String rawQuery = "{\n" +
                "  \"update\": \"" + collectionName + "\",\n" +
                "  \"updates\": [\n" +
                "    {\n" +
                "      \"q\": {\n" +
                "        \"_id\": ObjectId(\"id_of_document_to_update\")\n" +
                "      },\n" +
                "      \"u\": { \"$set\": { \"" + filterFieldName + "\": \"new value\" } }\n" +
                "    }\n" +
                "  ]\n" +
                "}\n";

        return new DatasourceStructure.Template(
                "Update",
                rawQuery,
                pluginSpecifiedTemplates
        );
    }

    public static DatasourceStructure.Template generateDeleteTemplate(String collectionName) {
        Map<Integer, Object> configMap = new HashMap<>();

        configMap.put(ConfigurationIndex.BSON, Boolean.FALSE);
        configMap.put(ConfigurationIndex.INPUT_TYPE, "FORM");
        configMap.put(ConfigurationIndex.COMMAND, "DELETE");
        configMap.put(ConfigurationIndex.COLLECTION, collectionName);
        configMap.put(ConfigurationIndex.DELETE_QUERY, "{ \"_id\": ObjectId(\"id_of_document_to_delete\") }");
        configMap.put(ConfigurationIndex.DELETE_LIMIT, "SINGLE");

        List<Property> pluginSpecifiedTemplates = generateMongoFormConfigTemplates(configMap);

        String rawQuery = "{\n" +
                "  \"delete\": \"" + collectionName + "\",\n" +
                "  \"deletes\": [\n" +
                "    {\n" +
                "      \"q\": {\n" +
                "        \"_id\": \"id_of_document_to_delete\"\n" +
                "      },\n" +
                "      \"limit\": 1\n" +
                "    }\n" +
                "  ]\n" +
                "}\n";

        return new DatasourceStructure.Template(
                "Delete",
                rawQuery,
                pluginSpecifiedTemplates
        );
    }
}
