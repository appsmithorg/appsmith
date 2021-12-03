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
import static com.external.plugins.constants.FieldName.SMART_SUBSTITUTION;
import static com.external.plugins.constants.FieldName.UPDATE_LIMIT;
import static com.external.plugins.constants.FieldName.UPDATE_QUERY;
import static com.external.plugins.constants.FieldName.UPDATE_OPERATION;

@Getter
@Setter
@NoArgsConstructor
public class UpdateMany extends MongoCommand {
    String query;
    String update;
    Boolean multi = Boolean.FALSE;

    public UpdateMany(ActionConfiguration actionConfiguration) {
        super(actionConfiguration);

        Map<String, Object> formData = actionConfiguration.getFormData();

        if (validConfigurationPresentInFormData(formData, UPDATE_QUERY)) {
            this.query = (String) getValueSafelyFromFormData(formData, UPDATE_QUERY);
        }

        if (validConfigurationPresentInFormData(formData, UPDATE_OPERATION)) {
            this.update = (String) getValueSafelyFromFormData(formData, UPDATE_OPERATION);
        }

        // Default for this is 1 to indicate updating only one document at a time.
        if (validConfigurationPresentInFormData(formData, UPDATE_LIMIT)) {
            String limitOption = (String) getValueSafelyFromFormData(formData, UPDATE_LIMIT);
            if ("ALL".equals(limitOption)) {
                this.multi = Boolean.TRUE;
            }
        }
    }

    @Override
    public Boolean isValid() {
        if (super.isValid()) {
            if (!StringUtils.isNullOrEmpty(query) && !StringUtils.isNullOrEmpty(update)) {
                return Boolean.TRUE;
            } else {
                // Not adding smart defaults for query due to data impact
                if (StringUtils.isNullOrEmpty(query)) {
                    fieldNamesWithNoConfiguration.add("Query");
                }
                // Not adding smart defaults for query due to data impact
                if (StringUtils.isNullOrEmpty(update)) {
                    fieldNamesWithNoConfiguration.add("Update");
                }
            }
        }
        return Boolean.FALSE;
    }

    @Override
    public Document parseCommand() {
        Document document = new Document();

        document.put("update", this.collection);

        Document queryDocument = parseSafely("Query", this.query);

        Document updateDocument = parseSafely("Update", this.update);

        Document update = new Document();
        update.put("q", queryDocument);
        update.put("u", updateDocument);
        update.put("multi", multi);

        List<Document> updates = new ArrayList<>();
        updates.add(update);

        document.put("updates", updates);

        return document;
    }

    @Override
    public List<DatasourceStructure.Template> generateTemplate(Map<String, Object> templateConfiguration) {
        String collectionName = (String) templateConfiguration.get("collectionName");
        String filterFieldName = (String) templateConfiguration.get("filterFieldName");

        Map<String, Object> configMap = new HashMap<>();

        setValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setValueSafelyInFormData(configMap, COMMAND, "UPDATE");
        setValueSafelyInFormData(configMap, COLLECTION, collectionName);
        setValueSafelyInFormData(configMap, UPDATE_QUERY, "{ \"_id\": ObjectId(\"id_of_document_to_update\") }");
        setValueSafelyInFormData(configMap, UPDATE_OPERATION, "{ \"$set\": { \"" + filterFieldName + "\": \"new value\" } }");
        setValueSafelyInFormData(configMap, UPDATE_LIMIT, "ALL");

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

        return Collections.singletonList(new DatasourceStructure.Template(
                "Update",
                rawQuery,
                configMap
        ));
    }
}
