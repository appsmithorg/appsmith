package com.external.plugins.commands;

import com.appsmith.external.constants.DataType;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.helpers.DataTypeStringUtils;
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

import static com.appsmith.external.helpers.PluginUtils.getValueSafelyFromFormData;
import static com.external.plugins.utils.MongoPluginUtils.parseSafely;
import static com.appsmith.external.helpers.PluginUtils.setValueSafelyInFormData;
import static com.appsmith.external.helpers.PluginUtils.validConfigurationPresentInFormData;
import static com.external.plugins.constants.FieldName.COLLECTION;
import static com.external.plugins.constants.FieldName.COMMAND;
import static com.external.plugins.constants.FieldName.INSERT_DOCUMENT;
import static com.external.plugins.constants.FieldName.SMART_SUBSTITUTION;

@Getter
@Setter
@NoArgsConstructor
public class Insert extends MongoCommand {
    String documents;

    public Insert(ActionConfiguration actionConfiguration) {
        super(actionConfiguration);

        Map<String, Object> formData = actionConfiguration.getFormData();

        if (validConfigurationPresentInFormData(formData, INSERT_DOCUMENT)) {
            this.documents = (String) getValueSafelyFromFormData(formData, INSERT_DOCUMENT);
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

        commandDocument.put("insert", this.collection);

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

        setValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setValueSafelyInFormData(configMap, COMMAND, "INSERT");
        setValueSafelyInFormData(configMap, INSERT_DOCUMENT, "[{" + sampleInsertDocuments + "}]");
        setValueSafelyInFormData(configMap, COLLECTION, collectionName);

        String rawQuery = "{\n" +
                "  \"insert\": \"" + collectionName + "\",\n" +
                "  \"documents\": [\n" +
                "    {\n" +
                sampleInsertDocuments +
                "    }\n" +
                "  ]\n" +
                "}\n";

        return Collections.singletonList(new DatasourceStructure.Template(
                "Insert",
                rawQuery,
                configMap
        ));
    }
}