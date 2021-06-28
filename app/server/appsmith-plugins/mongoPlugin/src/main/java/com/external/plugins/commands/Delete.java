package com.external.plugins.commands;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.Property;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.bson.Document;
import org.pf4j.util.StringUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.external.plugins.MongoPluginUtils.generateMongoFormConfigTemplates;
import static com.external.plugins.MongoPluginUtils.parseSafely;
import static com.external.plugins.MongoPluginUtils.validConfigurationPresent;
import static com.external.plugins.constants.ConfigurationIndex.SMART_BSON_SUBSTITUTION;
import static com.external.plugins.constants.ConfigurationIndex.COLLECTION;
import static com.external.plugins.constants.ConfigurationIndex.COMMAND;
import static com.external.plugins.constants.ConfigurationIndex.DELETE_LIMIT;
import static com.external.plugins.constants.ConfigurationIndex.DELETE_QUERY;
import static com.external.plugins.constants.ConfigurationIndex.INPUT_TYPE;

@Getter
@Setter
@NoArgsConstructor
public class Delete extends MongoCommand {
    String query;
    Integer limit = 1; // Can be only 0 or 1. 0 indicates all matching documents, 1 indicates single matching document

    public Delete(ActionConfiguration actionConfiguration) {
        super(actionConfiguration);

        List<Property> pluginSpecifiedTemplates = actionConfiguration.getPluginSpecifiedTemplates();

        if (validConfigurationPresent(pluginSpecifiedTemplates, DELETE_QUERY)) {
            this.query = (String) pluginSpecifiedTemplates.get(DELETE_QUERY).getValue();
        }

        // Default for this is 1 to indicate deleting only one document at a time.
        if (validConfigurationPresent(pluginSpecifiedTemplates, DELETE_LIMIT)) {
            String limitOption = (String) pluginSpecifiedTemplates.get(DELETE_LIMIT).getValue();
            if ("ALL".equals(limitOption)) {
                this.limit = 0;
            }
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

        document.put("delete", this.collection);

        Document queryDocument = parseSafely("Query", this.query);

        Document delete = new Document();
        delete.put("q", queryDocument);
        delete.put("limit", this.limit);

        List<Document> deletes = new ArrayList<>();
        deletes.add(delete);

        document.put("deletes", deletes);

        return document;
    }

    @Override
    public List<DatasourceStructure.Template> generateTemplate(Map<String, Object> templateConfiguration) {
        String collectionName = (String) templateConfiguration.get("collectionName");

        Map<Integer, Object> configMap = new HashMap<>();

        configMap.put(SMART_BSON_SUBSTITUTION, Boolean.TRUE);
        configMap.put(INPUT_TYPE, "FORM");
        configMap.put(COMMAND, "DELETE");
        configMap.put(COLLECTION, collectionName);
        configMap.put(DELETE_QUERY, "{ \"_id\": ObjectId(\"id_of_document_to_delete\") }");
        configMap.put(DELETE_LIMIT, "SINGLE");

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

        return Collections.singletonList(new DatasourceStructure.Template(
                "Delete",
                rawQuery,
                pluginSpecifiedTemplates
        ));
    }
}
