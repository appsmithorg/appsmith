package com.external.plugins.commands;

import com.appsmith.external.constants.DataType;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.helpers.DataTypeStringUtils;
import com.appsmith.external.helpers.PluginUtils;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.bson.BsonArray;
import org.bson.Document;
import org.bson.json.JsonParseException;
import org.pf4j.util.StringUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.external.helpers.PluginUtils.STRING_TYPE;
import static com.appsmith.external.helpers.PluginUtils.setDataValueSafelyInFormData;
import static com.appsmith.external.helpers.PluginUtils.validConfigurationPresentInFormData;
import static com.external.plugins.constants.FieldName.AGGREGATE;
import static com.external.plugins.constants.FieldName.AGGREGATE_LIMIT;
import static com.external.plugins.constants.FieldName.AGGREGATE_PIPELINES;
import static com.external.plugins.constants.FieldName.BODY;
import static com.external.plugins.constants.FieldName.COLLECTION;
import static com.external.plugins.constants.FieldName.COMMAND;
import static com.external.plugins.constants.FieldName.SMART_SUBSTITUTION;
import static com.external.plugins.utils.MongoPluginUtils.parseSafely;
import static org.apache.commons.lang3.StringUtils.isBlank;

@Getter
@Setter
@NoArgsConstructor
public class Aggregate extends MongoCommand {
    String pipeline;
    String limit;

    public Aggregate(ActionConfiguration actionConfiguration) {
        super(actionConfiguration);

        Map<String, Object> formData = actionConfiguration.getFormData();

        if (validConfigurationPresentInFormData(formData, AGGREGATE_PIPELINES)) {
            this.pipeline = PluginUtils.getDataValueSafelyFromFormData(formData, AGGREGATE_PIPELINES, STRING_TYPE);
        }

        if (validConfigurationPresentInFormData(formData, AGGREGATE_LIMIT)) {
            this.limit = PluginUtils.getDataValueSafelyFromFormData(formData, AGGREGATE_LIMIT, STRING_TYPE);
        }
    }

    @Override
    public Boolean isValid() {
        if (super.isValid()) {
            if (!StringUtils.isNullOrEmpty(pipeline)) {
                return Boolean.TRUE;
            } else {
                fieldNamesWithNoConfiguration.add("Array of Pipelines");
            }
        }

        return Boolean.FALSE;
    }

    @Override
    public Document parseCommand() {
        Document commandDocument = new Document();

        commandDocument.put(AGGREGATE, this.collection);

        DataType dataType = DataTypeStringUtils.stringToKnownDataTypeConverter(this.pipeline);
        if (dataType.equals(DataType.ARRAY)) {
            try {
                BsonArray arrayListFromInput = BsonArray.parse(this.pipeline);
                if (arrayListFromInput.isEmpty()) {
                    commandDocument.put("pipeline", "[]");
                } else {
                    commandDocument.put("pipeline", arrayListFromInput);
                }
            } catch (JsonParseException e) {
                throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "Array of Pipelines could not be parsed into expected Mongo BSON Array format.");
            }
        } else {
            // The command expects the pipelines to be sent in an array. Parse and create a single element array

            // check for enclosing curly bracket to make json validation more strict
            final String jsonObject = this.pipeline.trim();
            if (jsonObject.charAt(jsonObject.length() - 1) != '}') {
                throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "Pipeline stage is not a valid JSON object.");
            }

            Document document = parseSafely("Array of Pipelines", this.pipeline);
            ArrayList<Document> documentArrayList = new ArrayList<>();
            documentArrayList.add(document);

            commandDocument.put("pipeline", documentArrayList);
        }

        // Default to returning 10 documents if not mentioned
        int limit = 10;
        if (!isBlank(this.limit)) {
            limit = Integer.parseInt(this.limit);
        }
        commandDocument.put("cursor", parseSafely("cursor", "{batchSize: " + limit + "}"));

        return commandDocument;
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
        sb.append("  \"aggregate\": \"" + this.collection + "\",\n");

        String pipeline = "[]";
        if (!isBlank(this.pipeline)) {
            pipeline = this.pipeline;
        }
        sb.append("  \"pipeline\": " + pipeline + ",\n");
        sb.append("  \"cursor\": " + "{}" + "\n");
        sb.append("}\n");

        return sb.toString();
    }

    @Override
    public List<DatasourceStructure.Template> generateTemplate(Map<String, Object> templateConfiguration) {
        String collectionName = (String) templateConfiguration.get("collectionName");

        Map<String, Object> configMap = new HashMap<>();

        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(configMap, COMMAND, "AGGREGATE");
        setDataValueSafelyInFormData(configMap, COLLECTION, collectionName);
        setDataValueSafelyInFormData(configMap, AGGREGATE_PIPELINES, "[ {\"$sort\" : {\"_id\": 1} } ]");
        setDataValueSafelyInFormData(configMap, AGGREGATE_LIMIT, "10");

        String rawQuery = "{\n" +
                "  \"aggregate\": \"" + collectionName + "\",\n" +
                "  \"pipeline\": " + "[ {\"$sort\" : {\"_id\": 1} } ],\n" +
                "  \"limit\": 10,\n" +
                "  \"explain\": \"true\"\n" + // Specifies to return the information on the processing of the pipeline. (This also avoids the use of the 'cursor' aggregate key according to Mongo doc)
                "}\n";
        setDataValueSafelyInFormData(configMap, BODY, rawQuery);

        return Collections.singletonList(new DatasourceStructure.Template(
                "Aggregate",
                null,
                configMap
        ));
    }
}
