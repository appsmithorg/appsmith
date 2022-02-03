package com.external.plugins.commands;

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

import static com.appsmith.external.helpers.PluginUtils.getValueSafelyFromFormData;
import static com.external.plugins.utils.MongoPluginUtils.parseSafely;
import static com.appsmith.external.helpers.PluginUtils.setValueSafelyInFormData;
import static com.appsmith.external.helpers.PluginUtils.validConfigurationPresentInFormData;
import static com.external.plugins.constants.FieldName.COLLECTION;
import static com.external.plugins.constants.FieldName.COMMAND;
import static com.external.plugins.constants.FieldName.DELETE_LIMIT;
import static com.external.plugins.constants.FieldName.DELETE_QUERY;
import static com.external.plugins.constants.FieldName.SMART_SUBSTITUTION;

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
            this.query = (String) getValueSafelyFromFormData(formData, DELETE_QUERY);
        }

        if (validConfigurationPresentInFormData(formData, DELETE_LIMIT)) {
            String limitOption = (String) getValueSafelyFromFormData(formData, DELETE_LIMIT);
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

        Map<String, Object> configMap = new HashMap<>();

        setValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setValueSafelyInFormData(configMap, COMMAND, "DELETE");
        setValueSafelyInFormData(configMap, COLLECTION, collectionName);
        setValueSafelyInFormData(configMap, DELETE_QUERY, "{ \"_id\": ObjectId(\"id_of_document_to_delete\") }");
        setValueSafelyInFormData(configMap, DELETE_LIMIT, "SINGLE");

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
                configMap
        ));
    }
}