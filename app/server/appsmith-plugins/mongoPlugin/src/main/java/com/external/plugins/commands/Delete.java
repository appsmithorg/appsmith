package com.external.plugins.commands;

import com.appsmith.external.helpers.PluginUtils;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceStructure;
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

import static com.appsmith.external.helpers.PluginUtils.STRING_TYPE;
import static com.appsmith.external.helpers.PluginUtils.setDataValueSafelyInFormData;
import static com.appsmith.external.helpers.PluginUtils.validConfigurationPresentInFormData;
import static com.external.plugins.constants.FieldName.BODY;
import static com.external.plugins.constants.FieldName.COLLECTION;
import static com.external.plugins.constants.FieldName.COMMAND;
import static com.external.plugins.constants.FieldName.DELETE;
import static com.external.plugins.constants.FieldName.DELETE_LIMIT;
import static com.external.plugins.constants.FieldName.DELETE_QUERY;
import static com.external.plugins.constants.FieldName.SMART_SUBSTITUTION;
import static com.external.plugins.utils.MongoPluginUtils.parseSafely;

@Getter
@Setter
@NoArgsConstructor
public class Delete extends MongoCommand {
    String query;
    Integer limit = 1; // Can be only 0 or 1. 0 indicates all matching documents, 1 indicates single matching document

    public Delete(ActionConfiguration actionConfiguration) {
        super(actionConfiguration);

        Map<String, Object> formData = actionConfiguration.getFormData();

        if (validConfigurationPresentInFormData(formData, DELETE_QUERY)) {
            this.query = PluginUtils.getDataValueSafelyFromFormData(formData, DELETE_QUERY, STRING_TYPE);
        }

        if (validConfigurationPresentInFormData(formData, DELETE_LIMIT)) {
            String limitOption = PluginUtils.getDataValueSafelyFromFormData(formData, DELETE_LIMIT, STRING_TYPE);
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
                // Not adding smart defaults for query due to data impact
                fieldNamesWithNoConfiguration.add("Query");
            }
        }
        return Boolean.FALSE;
    }

    @Override
    public Document parseCommand() {
        Document document = new Document();

        document.put(DELETE, this.collection);

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

        Map<String, Object> configMap = new HashMap<>();

        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(configMap, COMMAND, "DELETE");
        setDataValueSafelyInFormData(configMap, COLLECTION, collectionName);
        setDataValueSafelyInFormData(configMap, DELETE_QUERY, "{ \"_id\": ObjectId(\"id_of_document_to_delete\") }");
        setDataValueSafelyInFormData(configMap, DELETE_LIMIT, "SINGLE");

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
        setDataValueSafelyInFormData(configMap, BODY, rawQuery);

        return Collections.singletonList(new DatasourceStructure.Template(
                "Delete",
                null,
                configMap
        ));
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
        sb.append("  \"delete\": \"" + this.collection + "\",\n");
        sb.append("  \"deletes\": [{\n");
        sb.append("    \"q\": " + this.query + ",\n");
        sb.append("    \"limit\": " + this.limit + ",\n");
        sb.append("  }]\n");
        sb.append("}\n");

        return sb.toString();
    }
}