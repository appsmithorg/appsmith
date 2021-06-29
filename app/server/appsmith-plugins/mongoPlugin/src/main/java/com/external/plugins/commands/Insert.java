package com.external.plugins.commands;

import com.appsmith.external.constants.DataType;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.helpers.DataTypeStringUtils;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.Property;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.bson.Document;
import org.pf4j.util.StringUtils;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static com.external.plugins.MongoPluginUtils.generateMongoFormConfigTemplates;
import static com.external.plugins.MongoPluginUtils.parseSafely;
import static com.external.plugins.MongoPluginUtils.validConfigurationPresent;
import static com.external.plugins.constants.ConfigurationIndex.SMART_BSON_SUBSTITUTION;
import static com.external.plugins.constants.ConfigurationIndex.COLLECTION;
import static com.external.plugins.constants.ConfigurationIndex.COMMAND;
import static com.external.plugins.constants.ConfigurationIndex.INPUT_TYPE;
import static com.external.plugins.constants.ConfigurationIndex.INSERT_DOCUMENT;

@Getter
@Setter
@NoArgsConstructor
public class Insert extends MongoCommand {
    String documents;

    public Insert(ActionConfiguration actionConfiguration) {
        super(actionConfiguration);

        List<Property> pluginSpecifiedTemplates = actionConfiguration.getPluginSpecifiedTemplates();

        if (validConfigurationPresent(pluginSpecifiedTemplates, INSERT_DOCUMENT)) {
            this.documents = (String) pluginSpecifiedTemplates.get(INSERT_DOCUMENT).getValue();
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
                List arrayListFromInput = objectMapper.readValue(this.documents, List.class);
                if (arrayListFromInput.isEmpty()) {
                    commandDocument.put("documents", "[]");
                } else {
                    commandDocument.put("documents", arrayListFromInput);
                }
            } catch (IOException e) {
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

        Map<Integer, Object> configMap = new HashMap<>();

        configMap.put(SMART_BSON_SUBSTITUTION, Boolean.TRUE);
        configMap.put(INPUT_TYPE, "FORM");
        configMap.put(COMMAND, "INSERT");
        configMap.put(INSERT_DOCUMENT, "[{" + sampleInsertDocuments + "}]");
        configMap.put(COLLECTION, collectionName);

        List<Property> pluginSpecifiedTemplates = generateMongoFormConfigTemplates(configMap);

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
                pluginSpecifiedTemplates
        ));
    }
}
