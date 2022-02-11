package com.external.plugins.commands;

import com.appsmith.external.constants.DataType;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.helpers.DataTypeStringUtils;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.ActionConfiguration;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import org.bson.BsonArray;
import org.bson.Document;
import org.bson.json.JsonParseException;
import org.pf4j.util.StringUtils;

import java.util.ArrayList;
import java.util.Map;
import java.util.List;
import java.util.HashMap;
import java.util.Collections;

import static com.appsmith.external.helpers.PluginUtils.getValueSafelyFromFormData;
import static com.appsmith.external.helpers.PluginUtils.setValueSafelyInFormData;
import static com.external.plugins.constants.FieldName.AGGREGATE_LIMIT;
import static com.external.plugins.utils.MongoPluginUtils.parseSafely;
import static com.appsmith.external.helpers.PluginUtils.validConfigurationPresentInFormData;
import static com.external.plugins.constants.FieldName.AGGREGATE_PIPELINE;
import static org.apache.commons.lang3.StringUtils.isBlank;
import static com.external.plugins.constants.FieldName.COLLECTION;
import static com.external.plugins.constants.FieldName.COMMAND;
import static com.external.plugins.constants.FieldName.SMART_SUBSTITUTION;


@Getter
@Setter
@NoArgsConstructor
public class Aggregate extends MongoCommand {
    String pipeline;
    String limit;

    public Aggregate(ActionConfiguration actionConfiguration) {
        super(actionConfiguration);

        Map<String, Object> formData = actionConfiguration.getFormData();

        if (validConfigurationPresentInFormData(formData, AGGREGATE_PIPELINE)) {
            this.pipeline = (String) getValueSafelyFromFormData(formData, AGGREGATE_PIPELINE);
        }

        if (validConfigurationPresentInFormData(formData, AGGREGATE_LIMIT)) {
            this.limit = (String) getValueSafelyFromFormData(formData, AGGREGATE_LIMIT);
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

        commandDocument.put("aggregate", this.collection);

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

    @Override
    public List<DatasourceStructure.Template> generateTemplate(Map<String, Object> templateConfiguration) {
        String collectionName = (String) templateConfiguration.get("collectionName");

        Map<String, Object> configMap = new HashMap<>();

        setValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setValueSafelyInFormData(configMap, COMMAND, "AGGREGATE");
        setValueSafelyInFormData(configMap, COLLECTION, collectionName);
        setValueSafelyInFormData(configMap, AGGREGATE_PIPELINE, "[ {\"$sort\" : {\"_id\": 1} } ]");
        setValueSafelyInFormData(configMap, AGGREGATE_LIMIT, "10");


        String rawQuery = "{\n" +
                "  \"aggregate\": \"" + collectionName + "\",\n" +
                "  \"pipeline\": " + "[ {\"$sort\" : {\"_id\": 1} } ],\n" +
                "  \"limit\": 10,\n" +
                "  \"explain\": \"true\"\n" + // Specifies to return the information on the processing of the pipeline. (This also avoids the use of the 'cursor' aggregate key according to Mongo doc)
                "}\n";

        return Collections.singletonList(new DatasourceStructure.Template(
                "Aggregate",
                rawQuery,
                configMap
        ));
    }
}
