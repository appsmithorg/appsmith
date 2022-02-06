package com.external.plugins.commands;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.bson.Document;
import org.pf4j.util.StringUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.external.helpers.PluginUtils.getValueSafelyFromFormData;
import static com.external.plugins.utils.MongoPluginUtils.parseSafely;
import static com.appsmith.external.helpers.PluginUtils.setValueSafelyInFormData;
import static com.appsmith.external.helpers.PluginUtils.validConfigurationPresentInFormData;
import static com.external.plugins.constants.FieldName.COLLECTION;
import static com.external.plugins.constants.FieldName.COMMAND;
import static com.external.plugins.constants.FieldName.FIND_LIMIT;
import static com.external.plugins.constants.FieldName.FIND_PROJECTION;
import static com.external.plugins.constants.FieldName.FIND_QUERY;
import static com.external.plugins.constants.FieldName.FIND_SKIP;
import static com.external.plugins.constants.FieldName.FIND_SORT;
import static com.external.plugins.constants.FieldName.SMART_SUBSTITUTION;

@Getter
@Setter
@NoArgsConstructor
public class Find extends MongoCommand {
    String query;
    String sort;
    String projection;
    String limit;
    String skip;

    public Find(ActionConfiguration actionConfiguration) {
        super(actionConfiguration);

        Map<String, Object> formData = actionConfiguration.getFormData();

        if (validConfigurationPresentInFormData(formData, FIND_QUERY)) {
            this.query = (String) getValueSafelyFromFormData(formData, FIND_QUERY);
        }

        if (validConfigurationPresentInFormData(formData, FIND_SORT)) {
            this.sort = (String) getValueSafelyFromFormData(formData, FIND_SORT);
        }

        if (validConfigurationPresentInFormData(formData, FIND_PROJECTION)) {
            this.projection = (String) getValueSafelyFromFormData(formData, FIND_PROJECTION);
        }

        if (validConfigurationPresentInFormData(formData, FIND_LIMIT)) {
            this.limit = (String) getValueSafelyFromFormData(formData, FIND_LIMIT);
        }

        if (validConfigurationPresentInFormData(formData, FIND_SKIP)) {
            this.skip = (String) getValueSafelyFromFormData(formData, FIND_SKIP);
        }
    }

    @Override
    public Document parseCommand() {
        Document document = new Document();

        if (StringUtils.isNullOrEmpty(this.query)) {
            this.query = "{}";
        }

        document.put("find", this.collection);

        document.put("filter", parseSafely("Query", this.query));

        if (!StringUtils.isNullOrEmpty(this.sort)) {
            document.put("sort", parseSafely("Sort", this.sort));
        }

        if (!StringUtils.isNullOrEmpty(this.projection)) {
            document.put("projection", parseSafely("Projection", this.projection));
        }

        // Default to returning 10 documents if not mentioned
        int limit = 10;
        if (!StringUtils.isNullOrEmpty(this.limit)) {
            limit = Integer.parseInt(this.limit);
        }
        document.put("limit", limit);
        document.put("batchSize", limit);

        if (!StringUtils.isNullOrEmpty(this.skip)) {
            document.put("skip", Long.parseLong(this.skip));
        }

        return document;
    }

    @Override
    public List<DatasourceStructure.Template> generateTemplate(Map<String, Object> templateConfiguration) {
        String collectionName = (String) templateConfiguration.get("collectionName");
        String filterFieldName = (String) templateConfiguration.get("filterFieldName");
        String filterFieldValue = (String) templateConfiguration.get("filterFieldValue");

        List<DatasourceStructure.Template> templates = new ArrayList<>();

        templates.add(generateFindTemplate(collectionName, filterFieldName, filterFieldValue));

        templates.add(generateFindByIdTemplate(collectionName));

        return templates;
    }

    private DatasourceStructure.Template generateFindTemplate(String collectionName, String filterFieldName, String filterFieldValue) {
        Map<String, Object> configMap = new HashMap<>();

        setValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setValueSafelyInFormData(configMap, COMMAND, "FIND");
        setValueSafelyInFormData(configMap, COLLECTION, collectionName);
        setValueSafelyInFormData(configMap, FIND_SORT, "{\"_id\": 1}");
        setValueSafelyInFormData(configMap, FIND_LIMIT, "10");

        String query = filterFieldName == null ? "{}" :
                "{ \"" + filterFieldName + "\": \"" + filterFieldValue + "\"}";
        setValueSafelyInFormData(configMap, FIND_QUERY, query);

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
                configMap
        );
    }

    private DatasourceStructure.Template generateFindByIdTemplate(String collectionName) {
        Map<String, Object> configMap = new HashMap<>();

        setValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setValueSafelyInFormData(configMap, COMMAND, "FIND");
        setValueSafelyInFormData(configMap, FIND_QUERY, "{\"_id\": ObjectId(\"id_to_query_with\")}");
        setValueSafelyInFormData(configMap, COLLECTION, collectionName);

        String rawQuery = "{\n" +
                "  \"find\": \"" + collectionName + "\",\n" +
                "  \"filter\": {\n" +
                "    \"_id\": ObjectId(\"id_to_query_with\")\n" +
                "  }\n" +
                "}\n";

        return new DatasourceStructure.Template(
                "Find by ID",
                rawQuery,
                configMap
        );
    }
}