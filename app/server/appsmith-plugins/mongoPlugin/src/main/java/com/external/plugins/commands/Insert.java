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
import java.util.stream.Collectors;

import static com.appsmith.external.helpers.PluginUtils.STRING_TYPE;
import static com.appsmith.external.helpers.PluginUtils.setDataValueSafelyInFormData;
import static com.appsmith.external.helpers.PluginUtils.validConfigurationPresentInFormData;
import static com.external.plugins.constants.FieldName.BODY;
import static com.external.plugins.constants.FieldName.COLLECTION;
import static com.external.plugins.constants.FieldName.COMMAND;
import static com.external.plugins.constants.FieldName.INSERT;
import static com.external.plugins.constants.FieldName.INSERT_DOCUMENT;
import static com.external.plugins.constants.FieldName.SMART_SUBSTITUTION;
import static org.apache.commons.lang3.StringUtils.isBlank;
import static com.external.plugins.utils.MongoPluginUtils.parseSafely;

@Getter
@Setter
@NoArgsConstructor
public class Insert extends MongoCommand {
    String documents;

    public Insert(ActionConfiguration actionConfiguration) {
        super(actionConfiguration);

        Map<String, Object> formData = actionConfiguration.getFormData();

        if (validConfigurationPresentInFormData(formData, INSERT_DOCUMENT)) {
            this.documents = PluginUtils.getDataValueSafelyFromFormData(formData, INSERT_DOCUMENT, STRING_TYPE);
        }
    }

    @Override
    public Boolean isValid() {
        if (super.isValid()) {
            if (!StringUtils.isNullOrEmpty(documents)) {
                return Boolean.TRUE;
            } else {
                fieldNamesWithNoConfiguration.add("Documents");
            }
        }
        return Boolean.FALSE;
    }

    @Override
    public Document parseCommand() {
        Document commandDocument = new Document();

        commandDocument.put(INSERT, this.collection);

        DataType dataType = DataTypeStringUtils.stringToKnownDataTypeConverter(this.documents);
        if (dataType.equals(DataType.ARRAY)) {
            try {
                List arrayListFromInput = BsonArray.parse(this.documents);
                if (arrayListFromInput.isEmpty()) {
                    commandDocument.put("documents", "[]");
                } else {
                    commandDocument.put("documents", arrayListFromInput);
                }
            } catch (JsonParseException e) {
                throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "Documents" + " could not be parsed into expected JSON Array format.");
            }
        } else {
            // The command expects the documents to be sent in an array. Parse and create a single element array
            Document document = parseSafely("Documents", this.documents);
            ArrayList<Document> documentArrayList = new ArrayList<>();
            documentArrayList.add(document);

            commandDocument.put("documents", documentArrayList);
        }

        return commandDocument;
    }

    @Override
    public List<DatasourceStructure.Template> generateTemplate(Map<String, Object> templateConfiguration) {
        String collectionName = (String) templateConfiguration.get("collectionName");
        Map<String, String> sampleInsertValues = (Map<String, String>) templateConfiguration.get("sampleInsertValues");

        String sampleInsertDocuments = sampleInsertValues.entrySet().stream()
                .map(entry -> "      \"" + entry.getKey() + "\": " + entry.getValue() + ",\n")
                .sorted()
                .collect(Collectors.joining(""));

        Map<String, Object> configMap = new HashMap<>();

        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(configMap, COMMAND, "INSERT");
        setDataValueSafelyInFormData(configMap, INSERT_DOCUMENT, "[{" + sampleInsertDocuments + "}]");
        setDataValueSafelyInFormData(configMap, COLLECTION, collectionName);

        String rawQuery = "{\n" +
                "  \"insert\": \"" + collectionName + "\",\n" +
                "  \"documents\": [\n" +
                "    {\n" +
                sampleInsertDocuments +
                "    }\n" +
                "  ]\n" +
                "}\n";
        setDataValueSafelyInFormData(configMap, BODY, rawQuery);

        return Collections.singletonList(new DatasourceStructure.Template(
                "Insert",
                null,
                configMap
        ));
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
        sb.append("  \"insert\": \"" + this.collection + "\",\n");

        /* Default to empty list of documents */
        String documents = "[]";
        if (!isBlank(this.documents)) {
            documents = this.documents;
        }
        sb.append("  \"documents\": " + documents + "\n");
        sb.append("}\n");

        return sb.toString();
    }
}