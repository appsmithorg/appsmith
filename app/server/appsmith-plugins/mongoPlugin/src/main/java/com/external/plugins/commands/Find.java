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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.external.helpers.PluginUtils.STRING_TYPE;
import static com.appsmith.external.helpers.PluginUtils.setDataValueSafelyInFormData;
import static com.appsmith.external.helpers.PluginUtils.validConfigurationPresentInFormData;
import static com.external.plugins.constants.FieldName.BODY;
import static com.external.plugins.constants.FieldName.COLLECTION;
import static com.external.plugins.constants.FieldName.COMMAND;
import static com.external.plugins.constants.FieldName.FIND;
import static com.external.plugins.constants.FieldName.FIND_LIMIT;
import static com.external.plugins.constants.FieldName.FIND_PROJECTION;
import static com.external.plugins.constants.FieldName.FIND_QUERY;
import static com.external.plugins.constants.FieldName.FIND_SKIP;
import static com.external.plugins.constants.FieldName.FIND_SORT;
import static com.external.plugins.constants.FieldName.SMART_SUBSTITUTION;
import static com.external.plugins.utils.MongoPluginUtils.parseSafely;
import static org.apache.commons.lang3.StringUtils.isBlank;

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
            this.query = PluginUtils.getDataValueSafelyFromFormData(formData, FIND_QUERY, STRING_TYPE);
        }

        if (validConfigurationPresentInFormData(formData, FIND_SORT)) {
            this.sort = PluginUtils.getDataValueSafelyFromFormData(formData, FIND_SORT, STRING_TYPE);
        }

        if (validConfigurationPresentInFormData(formData, FIND_PROJECTION)) {
            this.projection = PluginUtils.getDataValueSafelyFromFormData(formData, FIND_PROJECTION, STRING_TYPE);
        }

        if (validConfigurationPresentInFormData(formData, FIND_LIMIT)) {
            this.limit = PluginUtils.getDataValueSafelyFromFormData(formData, FIND_LIMIT, STRING_TYPE);
        }

        if (validConfigurationPresentInFormData(formData, FIND_SKIP)) {
            this.skip = PluginUtils.getDataValueSafelyFromFormData(formData, FIND_SKIP, STRING_TYPE);
        }
    }

    @Override
    public Document parseCommand() {
        Document document = new Document();

        if (StringUtils.isNullOrEmpty(this.query)) {
            this.query = "{}";
        }

        document.put(FIND, this.collection);

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

        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(configMap, COMMAND, "FIND");
        setDataValueSafelyInFormData(configMap, COLLECTION, collectionName);
        setDataValueSafelyInFormData(configMap, FIND_SORT, "{\"_id\": 1}");
        setDataValueSafelyInFormData(configMap, FIND_LIMIT, "10");

        String query = filterFieldName == null ? "{}" :
                "{ \"" + filterFieldName + "\": \"" + filterFieldValue + "\"}";
        setDataValueSafelyInFormData(configMap, FIND_QUERY, query);

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
        setDataValueSafelyInFormData(configMap, BODY, rawQuery);

        return new DatasourceStructure.Template(
                "Find",
                null,
                configMap
        );
    }

    private DatasourceStructure.Template generateFindByIdTemplate(String collectionName) {
        Map<String, Object> configMap = new HashMap<>();

        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(configMap, COMMAND, "FIND");
        setDataValueSafelyInFormData(configMap, FIND_QUERY, "{\"_id\": ObjectId(\"id_to_query_with\")}");
        setDataValueSafelyInFormData(configMap, COLLECTION, collectionName);

        String rawQuery = "{\n" +
                "  \"find\": \"" + collectionName + "\",\n" +
                "  \"filter\": {\n" +
                "    \"_id\": ObjectId(\"id_to_query_with\")\n" +
                "  }\n" +
                "}\n";
        setDataValueSafelyInFormData(configMap, BODY, rawQuery);

        return new DatasourceStructure.Template(
                "Find by ID",
                null,
                configMap
        );
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
        sb.append("  \"find\": \"" + this.collection + "\",\n");

        if (!isBlank(this.query)) {
            sb.append("  \"filter\": " + this.query + ",\n");
        }

        if (!isBlank(this.sort)) {
            sb.append("  \"sort\": " + this.sort + ",\n");
        }

        if (!isBlank(this.skip)) {
            sb.append("  \"skip\": " + this.skip + ",\n");
        }

        /* Default to returning 10 documents if not mentioned */
        String limit = "10";
        if (!isBlank(this.limit)) {
            limit = this.limit;
        }
        sb.append("  \"limit\": " + limit + ",\n");
        sb.append("  \"batchSize\": " + limit + "\n");
        sb.append("}\n");

        return sb.toString();
    }
}
