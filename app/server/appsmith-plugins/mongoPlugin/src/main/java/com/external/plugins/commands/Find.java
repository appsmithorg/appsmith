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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.external.plugins.MongoPluginUtils.generateMongoFormConfigTemplates;
import static com.external.plugins.MongoPluginUtils.parseSafely;
import static com.external.plugins.MongoPluginUtils.validConfigurationPresent;
import static com.external.plugins.constants.ConfigurationIndex.SMART_BSON_SUBSTITUTION;
import static com.external.plugins.constants.ConfigurationIndex.COLLECTION;
import static com.external.plugins.constants.ConfigurationIndex.COMMAND;
import static com.external.plugins.constants.ConfigurationIndex.FIND_LIMIT;
import static com.external.plugins.constants.ConfigurationIndex.FIND_PROJECTION;
import static com.external.plugins.constants.ConfigurationIndex.FIND_QUERY;
import static com.external.plugins.constants.ConfigurationIndex.FIND_SKIP;
import static com.external.plugins.constants.ConfigurationIndex.FIND_SORT;
import static com.external.plugins.constants.ConfigurationIndex.INPUT_TYPE;

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

        List<Property> pluginSpecifiedTemplates = actionConfiguration.getPluginSpecifiedTemplates();

        if (validConfigurationPresent(pluginSpecifiedTemplates, FIND_QUERY)) {
            this.query = (String) pluginSpecifiedTemplates.get(FIND_QUERY).getValue();
        }

        if (validConfigurationPresent(pluginSpecifiedTemplates, FIND_SORT)) {
            this.sort = (String) pluginSpecifiedTemplates.get(FIND_SORT).getValue();
        }

        if (validConfigurationPresent(pluginSpecifiedTemplates, FIND_PROJECTION)) {
            this.projection = (String) pluginSpecifiedTemplates.get(FIND_PROJECTION).getValue();
        }

        if (validConfigurationPresent(pluginSpecifiedTemplates, FIND_LIMIT)) {
            this.limit = (String) pluginSpecifiedTemplates.get(FIND_LIMIT).getValue();
        }

        if (validConfigurationPresent(pluginSpecifiedTemplates, FIND_SKIP)) {
            this.skip = (String) pluginSpecifiedTemplates.get(FIND_SKIP).getValue();
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
        Map<Integer, Object> configMap = new HashMap<>();

        configMap.put(SMART_BSON_SUBSTITUTION, Boolean.TRUE);
        configMap.put(INPUT_TYPE, "FORM");
        configMap.put(COMMAND, "FIND");
        configMap.put(COLLECTION, collectionName);
        configMap.put(FIND_SORT, "{\"_id\": 1}");
        configMap.put(FIND_LIMIT, "10");

        String query = filterFieldName == null ? "{}" :
                "{ \"" + filterFieldName + "\": \"" + filterFieldValue + "\"}";
        configMap.put(FIND_QUERY, query);

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

    private DatasourceStructure.Template generateFindByIdTemplate(String collectionName) {
        Map<Integer, Object> configMap = new HashMap<>();

        configMap.put(SMART_BSON_SUBSTITUTION, Boolean.TRUE);
        configMap.put(INPUT_TYPE, "FORM");
        configMap.put(COMMAND, "FIND");
        configMap.put(FIND_QUERY, "{\"_id\": ObjectId(\"id_to_query_with\")}");
        configMap.put(COLLECTION, collectionName);

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
}
