package com.appsmith.external.helpers;

import com.appsmith.external.constants.DisplayDataType;
import com.appsmith.external.constants.DataType;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ParsedDataType;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonSyntaxException;
import com.google.gson.TypeAdapter;
import com.google.gson.stream.JsonReader;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import net.minidev.json.parser.JSONParser;
import org.apache.commons.validator.routines.DateValidator;
import org.bson.BsonInvalidOperationException;
import org.bson.Document;
import org.bson.json.JsonParseException;
import reactor.core.Exceptions;

import java.io.IOException;
import java.io.StringReader;
import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.AbstractMap.SimpleEntry;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.apache.commons.lang3.ClassUtils.isPrimitiveOrWrapper;

@Slf4j
public class DataTypeStringUtils {

    private static String regexForQuestionMark = "\\?";

    private static Pattern questionPattern = Pattern.compile(regexForQuestionMark);

    private static ObjectMapper objectMapper = new ObjectMapper();

    private static JSONParser parser = new JSONParser(JSONParser.MODE_PERMISSIVE);

    private static final TypeAdapter<JsonObject> strictGsonObjectAdapter =
            new Gson().getAdapter(JsonObject.class);

    public static class DateValidatorUsingDateFormat extends DateValidator {
        private String dateFormat;

        public DateValidatorUsingDateFormat(String dateFormat) {
            this.dateFormat = dateFormat;
        }

        @Override
        public boolean isValid(String dateStr) {
            DateFormat sdf = new SimpleDateFormat(this.dateFormat);
            sdf.setLenient(false);
            try {
                sdf.parse(dateStr);
            } catch (ParseException e) {
                return false;
            }
            return true;
        }
    }

    public static DataType stringToKnownDataTypeConverter(String input) {

        if (input == null) {
            return DataType.NULL;
        }

        input = input.trim();

        if (input.startsWith("[") && input.endsWith("]")) {
            String betweenBraces = input.substring(1, input.length() - 1);
            String trimmedInputBetweenBraces = betweenBraces.trim();
            // In case of no values in the array, set this as null. Otherwise plugins like postgres and ms-sql
            // would break while creating a SQL array.
            if (trimmedInputBetweenBraces.isEmpty()) {
                return DataType.NULL;
            }
            return DataType.ARRAY;
        }

        try {
            Integer.parseInt(input);
            return DataType.INTEGER;
        } catch (NumberFormatException e) {
            // Not an integer
        }

        try {
            Long.parseLong(input);
            return DataType.LONG;
        } catch (NumberFormatException e1) {
            // Not long
        }

        try {
            Float.parseFloat(input);
            return DataType.FLOAT;
        } catch (NumberFormatException e2) {
            // Not float
        }

        try {
            Double.parseDouble(input);
            return DataType.DOUBLE;
        } catch (NumberFormatException e3) {
            // Not double
        }

        // Creating a copy of the input in lower case form to do simple string equality to check for boolean/null types.
        String copyInput = String.valueOf(input).toLowerCase().trim();
        if (copyInput.equals("true") || copyInput.equals("false")) {
            return DataType.BOOLEAN;
        }

        if (copyInput.equals("null")) {
            return DataType.NULL;
        }

        DateValidator timestampValidator = new DateValidatorUsingDateFormat("yyyy-MM-dd HH:mm:ss");
        if (timestampValidator.isValid(input)) {
            return DataType.TIMESTAMP;
        }

        DateValidator dateValidator = new DateValidatorUsingDateFormat("yyyy-mm-dd");
        if (dateValidator.isValid(input)) {
            return DataType.DATE;
        }

        DateValidator timeValidator = new DateValidatorUsingDateFormat("hh:mm:ss");
        if (timeValidator.isValid(input)) {
            return DataType.TIME;
        }

        try (JsonReader reader = new JsonReader(new StringReader(input))) {
            strictGsonObjectAdapter.read(reader);
            reader.hasNext(); // throws on multiple top level values
            return DataType.JSON_OBJECT;
        } catch (IOException | JsonSyntaxException e) {
            // Not a strict JSON object
        }

        try {
            Document.parse(input);
            return DataType.BSON;
        } catch (JsonParseException | BsonInvalidOperationException e) {
            // Not BSON
        }

        /**
         * TODO : ASCII, Binary and Bytes Array
         */

//        // Check if unicode stream also gets handled as part of this since the destination SQL type is the same.
//        if(StandardCharsets.US_ASCII.newEncoder().canEncode(input)) {
//            return Ascii.class;
//        }
//        if (isBinary(input)) {
//            return Binary.class;
//        }

//        try
//        {
//            input.getBytes("UTF-8");
//            return Byte.class;
//        } catch (UnsupportedEncodingException e) {
//            // Not byte
//        }

        // default return type if none of the above matches.
        return DataType.STRING;
    }

    public static String jsonSmartReplacementQuestionWithValue(String input,
                                                               String replacement,
                                                               List<Map.Entry<String, String>> insertedParams) {

        DataType dataType = DataTypeStringUtils.stringToKnownDataTypeConverter(replacement);

        Map.Entry<String, String> parameter = new SimpleEntry<>(replacement, dataType.toString());
        insertedParams.add(parameter);

        switch (dataType) {
            case INTEGER:
            case LONG:
            case FLOAT:
            case DOUBLE:
            case NULL:
            case BOOLEAN:
                input = questionPattern.matcher(input).replaceFirst(String.valueOf(replacement));
                break;
            case ARRAY:
                try {
                    JSONArray jsonArray = (JSONArray) parser.parse(replacement);
                    input = questionPattern.matcher(input).replaceFirst(String.valueOf(objectMapper.writeValueAsString(jsonArray)));
                } catch (net.minidev.json.parser.ParseException | JsonProcessingException e) {
                    throw Exceptions.propagate(
                            new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR,
                                    replacement,
                                    e.getMessage()
                            )
                    );
                }
                break;
            case JSON_OBJECT:
                try {
                    JSONObject jsonObject = (JSONObject) parser.parse(replacement);
                    String jsonString = String.valueOf(objectMapper.writeValueAsString(jsonObject));
                    // Adding Matcher.quoteReplacement so that "/" and "$" in the string are escaped during replacement
                    input = questionPattern.matcher(input).replaceFirst(Matcher.quoteReplacement(jsonString));
                } catch (net.minidev.json.parser.ParseException | JsonProcessingException e) {
                    throw Exceptions.propagate(
                            new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR,
                                    replacement,
                                    e.getMessage()
                            )
                    );
                }
                break;
            case BSON:
                input = questionPattern.matcher(input).replaceFirst(Matcher.quoteReplacement(replacement));
                break;
            case DATE:
            case TIME:
            case ASCII:
            case BINARY:
            case BYTES:
            case STRING:
            default:
                try {
                    replacement = escapeSpecialCharacters(replacement);
                    String valueAsString = objectMapper.writeValueAsString(replacement);
                    input = questionPattern.matcher(input).replaceFirst(valueAsString);
                } catch (JsonProcessingException e) {
                    throw Exceptions.propagate(
                            new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                    replacement,
                                    e.getMessage()
                            )
                    );
                }
        }

        return input;
    }

    private static String escapeSpecialCharacters(String raw) {
        String escaped = raw;
        escaped = escaped.replace("\\", "\\\\");
        escaped = escaped.replace("\"", "\\\"");
        escaped = escaped.replace("\b", "\\b");
        escaped = escaped.replace("\f", "\\f");
        escaped = escaped.replace("\n", "\\n");
        escaped = escaped.replace("\r", "\\r");
        escaped = escaped.replace("\t", "\\t");
        // TODO: escape other non-printing characters using uXXXX notation
        return escaped;
    }

    private static boolean isBinary(String input) {
        for (int i = 0; i < input.length(); i++) {
            int tempB = input.charAt(i);
            if (tempB == '0' || tempB == '1') {
                continue;
            }
            return false;
        }
        // no failures, so
        return true;
    }

    private static boolean isDisplayTypeTable(Object data) {
        if (data instanceof List) {
            // Check if the data is a list of simple json objects i.e. all values in the key value pairs are simple
            // objects or their wrappers.
            return ((List)data).stream()
                    .allMatch(item -> item instanceof Map
                            && ((Map)item).entrySet().stream()
                            .allMatch(e -> ((Map.Entry)e).getValue() == null ||
                            isPrimitiveOrWrapper(((Map.Entry)e).getValue().getClass())));
        }
        else if (data instanceof JsonNode) {
            // Check if the data is an array of simple json objects
            try {
                objectMapper.convertValue(data, new TypeReference<List<Map<String, String>>>() {});
                return true;
            } catch (IllegalArgumentException e) {
                return false;
            }
        }
        else if (data instanceof String) {
            // Check if the data is an array of simple json objects
            try {
                objectMapper.readValue((String)data, new TypeReference<List<Map<String, String>>>() {});
                return true;
            } catch (IOException e) {
                return false;
            }
        }

        return false;
    }
    
    private static boolean isDisplayTypeJson(Object data) {
        /*
         * - Any non string non primitive object is converted into a json when serializing.
         * - https://stackoverflow.com/questions/25039080/java-how-to-determine-if-type-is-any-of-primitive-wrapper-string-or-something/25039320
         */
        if (!isPrimitiveOrWrapper(data.getClass()) && !(data instanceof String)) {
            return true;
        }
        else if (data instanceof String) {
            try {
                objectMapper.readTree((String)data);
                return true;
            } catch (IOException e) {
                return false;
            }
        }

        return false;
    }

    public static List<ParsedDataType> getDisplayDataTypes(Object data) {

        if (data == null) {
            return new ArrayList<>();
        }

        List<ParsedDataType> dataTypes = new ArrayList<>();

        // Check if the data is a valid table.
        if (isDisplayTypeTable(data)) {
            dataTypes.add(new ParsedDataType(DisplayDataType.TABLE));
        }

        // Check if the data is a valid json.
        if (isDisplayTypeJson(data)) {
            dataTypes.add(new ParsedDataType(DisplayDataType.JSON));
        }

        // All data types can be categorized as raw by default.
        dataTypes.add(new ParsedDataType(DisplayDataType.RAW));

        return dataTypes;
    }
}
