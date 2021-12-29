package com.external.plugins.commands;

import com.appsmith.external.constants.DataType;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.helpers.DataTypeStringUtils;
import com.appsmith.external.models.ActionConfiguration;
import lombok.Getter;
import lombok.Setter;
import org.bson.BsonArray;
import org.bson.Document;
import org.bson.json.JsonParseException;
import org.pf4j.util.StringUtils;

import java.util.ArrayList;
import java.util.Map;

import static com.appsmith.external.helpers.PluginUtils.getValueSafelyFromFormData;
import static com.external.plugins.utils.MongoPluginUtils.parseSafely;
import static com.appsmith.external.helpers.PluginUtils.validConfigurationPresentInFormData;
import static com.external.plugins.constants.FieldName.AGGREGATE_PIPELINE;
import static org.apache.commons.lang3.StringUtils.isBlank;

@Getter
@Setter
public class Aggregate extends MongoCommand {
    String pipeline;

    public Aggregate(ActionConfiguration actionConfiguration) {
        super(actionConfiguration);

        Map<String, Object> formData = actionConfiguration.getFormData();

        if (validConfigurationPresentInFormData(formData, AGGREGATE_PIPELINE)) {
            this.pipeline = (String) getValueSafelyFromFormData(formData, AGGREGATE_PIPELINE);
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
            Document document = parseSafely("Array of Pipelines", this.pipeline);
            ArrayList<Document> documentArrayList = new ArrayList<>();
            documentArrayList.add(document);

            commandDocument.put("pipeline", documentArrayList);
        }

        // Add default cursor
        commandDocument.put("cursor", parseSafely("cursor", "{}"));

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
}
