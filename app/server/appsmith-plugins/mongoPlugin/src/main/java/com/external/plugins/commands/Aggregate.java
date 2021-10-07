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
}
