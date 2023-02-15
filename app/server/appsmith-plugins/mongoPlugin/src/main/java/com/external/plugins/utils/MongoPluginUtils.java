package com.external.plugins.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.helpers.PluginUtils;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.external.plugins.commands.Aggregate;
import com.external.plugins.commands.Count;
import com.external.plugins.commands.Delete;
import com.external.plugins.commands.Distinct;
import com.external.plugins.commands.Find;
import com.external.plugins.commands.Insert;
import com.external.plugins.commands.MongoCommand;
import com.external.plugins.commands.UpdateMany;

import com.external.plugins.exceptions.MongoPluginErrorMessages;
import org.bson.BsonInvalidOperationException;
import org.bson.Document;
import org.bson.json.JsonParseException;
import org.bson.types.Decimal128;
import org.bson.types.ObjectId;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.springframework.util.StringUtils;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.external.helpers.PluginUtils.STRING_TYPE;
import static com.appsmith.external.helpers.PluginUtils.getDataValueSafelyFromFormData;
import static com.external.plugins.constants.FieldName.BODY;
import static com.external.plugins.constants.FieldName.COMMAND;
import static com.external.plugins.constants.FieldName.RAW;

public class MongoPluginUtils {

    public static Document parseSafely(String fieldName, String input) {
        try {
            return Document.parse(input);
        } catch (JsonParseException | BsonInvalidOperationException e) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, String.format(MongoPluginErrorMessages.UNPARSABLE_FIELDNAME_ERROR_MSG, fieldName), e.getMessage());
        }
    }

    public static Object parseSafelyDocumentAndArrayOfDocuments(String fieldName, String input){
        try {
            return parseSafely(fieldName, input);
        } catch (AppsmithPluginException e) {
            try {
                List<Document> parsedDocumentList = new ArrayList<>();
                JSONArray rawInputJsonArray  = new JSONArray(input);
                for (int i=0; i < rawInputJsonArray.length(); i++) {
                    parsedDocumentList.add(parseSafely(fieldName, rawInputJsonArray.getJSONObject(i).toString()));
                }
                return parsedDocumentList;
            } catch (JSONException ne) {
                throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, String.format(MongoPluginErrorMessages.UNPARSABLE_FIELDNAME_ERROR_MSG, fieldName), e.getMessage());
            }
        }
   
    }

    public static Boolean isRawCommand(Map<String, Object> formData) {
        String command = PluginUtils.getDataValueSafelyFromFormData(formData, COMMAND, null);
        return RAW.equals(command);
    }

    public static String convertMongoFormInputToRawCommand(ActionConfiguration actionConfiguration) {
        Map<String, Object> formData = actionConfiguration.getFormData();
        if (formData != null && !formData.isEmpty()) {
            // If its not raw command, then it must be one of the mongo form commands
            if (!isRawCommand(formData)) {
                // Parse the commands into raw appropriately
                MongoCommand command = getMongoCommand(actionConfiguration);
                if (!command.isValid()) {
                    throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, String.format(MongoPluginErrorMessages.FIELD_WITH_NO_CONFIGURATION_ERROR_MSG, command.getFieldNamesWithNoConfiguration()));
                }

                return command.parseCommand().toJson();
            }
        }

        // We reached here. This means either this is a RAW command input or some configuration error has happened
        // in which case, we default to RAW
        return PluginUtils.getDataValueSafelyFromFormData(formData, BODY, PluginUtils.STRING_TYPE);
    }

    private static MongoCommand getMongoCommand(ActionConfiguration actionConfiguration) throws AppsmithPluginException {
        Map<String, Object> formData = actionConfiguration.getFormData();
        MongoCommand command;
        switch (getDataValueSafelyFromFormData(formData, COMMAND, STRING_TYPE, "")) {
            case "INSERT":
                command = new Insert(actionConfiguration);
                break;
            case "FIND":
                command = new Find(actionConfiguration);
                break;
            case "UPDATE":
                command = new UpdateMany(actionConfiguration);
                break;
            case "DELETE":
                command = new Delete(actionConfiguration);
                break;
            case "COUNT":
                command = new Count(actionConfiguration);
                break;
            case "DISTINCT":
                command = new Distinct(actionConfiguration);
                break;
            case "AGGREGATE":
                command = new Aggregate(actionConfiguration);
                break;
            default:
                throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, MongoPluginErrorMessages.NO_VALID_MONGO_COMMAND_FOUND_ERROR_MSG
                        );
        }

        return command;
    }

    public static String getDatabaseName(DatasourceConfiguration datasourceConfiguration) {
        String databaseName = null;

        // Explicitly set default database.
        if (datasourceConfiguration.getConnection() != null) {
            databaseName = datasourceConfiguration.getConnection().getDefaultDatabaseName();
        }

        // If that's not available, pick the authentication database.
        final DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
        if (!StringUtils.hasLength(databaseName) && authentication != null) {
            databaseName = authentication.getDatabaseName();
        }

        if (databaseName == null) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR, MongoPluginErrorMessages.DS_MISSING_DEFAULT_DATABASE_NAME_ERROR_MSG);
        }

        return databaseName;
    }

    public static void generateTemplatesAndStructureForACollection(String collectionName,
                                                                   Document document,
                                                                   ArrayList<DatasourceStructure.Column> columns,
                                                                   ArrayList<DatasourceStructure.Template> templates) {
        String filterFieldName = null;
        String filterFieldValue = null;
        Map<String, String> sampleInsertValues = new LinkedHashMap<>();

        for (Map.Entry<String, Object> entry : document.entrySet()) {
            final String name = entry.getKey();
            final Object value = entry.getValue();
            String type;
            boolean isAutogenerated = false;

            if (value instanceof Integer) {
                type = "Integer";
                sampleInsertValues.put(name, "1");
            } else if (value instanceof Long) {
                type = "Long";
                sampleInsertValues.put(name, "NumberLong(\"1\")");
            } else if (value instanceof Double) {
                type = "Double";
                sampleInsertValues.put(name, "1");
            } else if (value instanceof Decimal128) {
                type = "BigDecimal";
                sampleInsertValues.put(name, "NumberDecimal(\"1\")");
            } else if (value instanceof String) {
                type = "String";
                sampleInsertValues.put(name, "\"new value\"");
                if (filterFieldName == null || filterFieldName.compareTo(name) > 0) {
                    filterFieldName = name;
                    filterFieldValue = (String) value;
                }
            } else if (value instanceof ObjectId) {
                type = "ObjectId";
                isAutogenerated = true;
                if (!value.equals("_id")) {
                    sampleInsertValues.put(name, "ObjectId(\"a_valid_object_id_hex\")");
                }
            } else if (value instanceof Collection) {
                type = "Array";
                sampleInsertValues.put(name, "[1, 2, 3]");
            } else if (value instanceof Date) {
                type = "Date";
                sampleInsertValues.put(name, "new Date(\"2019-07-01\")");
            } else {
                type = "Object";
                sampleInsertValues.put(name, "{}");
            }

            columns.add(new DatasourceStructure.Column(name, type, null, isAutogenerated));
        }

        columns.sort(Comparator.naturalOrder());

        Map<String, Object> templateConfiguration = new HashMap<>();
        templateConfiguration.put("collectionName", collectionName);
        templateConfiguration.put("filterFieldName", filterFieldName);
        templateConfiguration.put("filterFieldValue", filterFieldValue);
        templateConfiguration.put("sampleInsertValues", sampleInsertValues);

        templates.addAll(
                new Find().generateTemplate(templateConfiguration)
        );


        templates.addAll(
                new Insert().generateTemplate(templateConfiguration)
        );

        templates.addAll(
                new UpdateMany().generateTemplate(templateConfiguration)
        );

        templates.addAll(
                new Delete().generateTemplate(templateConfiguration)
        );

        templates.addAll(
                new Count().generateTemplate(templateConfiguration)
        );

        templates.addAll(
                new Distinct().generateTemplate(templateConfiguration)
        );

        templates.addAll(
                new Aggregate().generateTemplate(templateConfiguration)
        );

    }

    public static String urlEncode(String text) {
        return URLEncoder.encode(text, StandardCharsets.UTF_8);
    }

    public static String getRawQuery(ActionConfiguration actionConfiguration) {
        MongoCommand command = getMongoCommand(actionConfiguration);
        return command.getRawQuery();
    }

}
