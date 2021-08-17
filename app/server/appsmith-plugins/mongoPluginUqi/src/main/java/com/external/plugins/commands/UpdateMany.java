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

import static com.external.plugins.MongoPluginUtils.getValueSafely;
import static com.external.plugins.MongoPluginUtils.parseSafely;
import static com.external.plugins.MongoPluginUtils.validConfigurationPresent;
import static com.external.plugins.constants.FieldName.COLLECTION;
import static com.external.plugins.constants.FieldName.COMMAND;
import static com.external.plugins.constants.FieldName.SMART_SUBSTITUTION;
import static com.external.plugins.constants.FieldName.UPDATE_LIMIT;
import static com.external.plugins.constants.FieldName.UPDATE_QUERY;
import static com.external.plugins.constants.FieldName.UPDATE_UPDATE;

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

        if (validConfigurationPresent(formData, UPDATE_QUERY)) {
            this.query = (String) getValueSafely(formData, UPDATE_QUERY);
        }

        if (validConfigurationPresent(formData, UPDATE_UPDATE)) {
            this.update = (String) getValueSafely(formData, UPDATE_UPDATE);
        }

        // Default for this is 1 to indicate updating only one document at a time.
        if (validConfigurationPresent(formData, UPDATE_LIMIT)) {
            String limitOption = (String) getValueSafely(formData, UPDATE_LIMIT);
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
                if (StringUtils.isNullOrEmpty(query)) {
                    fieldNamesWithNoConfiguration.add("Query");
                }
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

        configMap.put(SMART_SUBSTITUTION, Boolean.TRUE);
        configMap.put(COMMAND, "UPDATE");
        configMap.put(COLLECTION, collectionName);
        configMap.put(UPDATE_QUERY, "{ \"_id\": ObjectId(\"id_of_document_to_update\") }");
        configMap.put(UPDATE_UPDATE, "{ \"$set\": { \"" + filterFieldName + "\": \"new value\" } }");
        configMap.put(UPDATE_LIMIT, "ALL");

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
