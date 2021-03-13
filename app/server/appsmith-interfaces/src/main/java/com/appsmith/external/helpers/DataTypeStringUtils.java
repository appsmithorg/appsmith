package com.appsmith.external.helpers;

import com.appsmith.external.constants.DataType;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import net.minidev.json.parser.JSONParser;
import org.apache.commons.validator.routines.DateValidator;
import reactor.core.Exceptions;

import java.io.IOException;
import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.regex.Pattern;

@Slf4j
public class DataTypeStringUtils {

    private static String regexForQuestionMark = "\\?";

    private static Pattern questionPattern = Pattern.compile(regexForQuestionMark);

    private static  ObjectMapper objectMapper = new ObjectMapper();

    private static JSONParser parser = new JSONParser(JSONParser.MODE_PERMISSIVE);

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

        DateValidator dateValidator = new DateValidatorUsingDateFormat("yyyy-mm-dd");
        if (dateValidator.isValid(input)) {
            return DataType.DATE;
        }

        DateValidator dateTimeValidator = new DateValidatorUsingDateFormat("yyyy-mm-dd hh:mm:ss");
        if (dateTimeValidator.isValid(input)) {
            return DataType.DATE;
        }

        DateValidator timeValidator = new DateValidatorUsingDateFormat("hh:mm:ss");
        if (timeValidator.isValid(input)) {
            return DataType.TIME;
        }

        try {
            objectMapper.readValue(input, Object.class);
            return DataType.JSON_OBJECT;
        } catch (IOException e) {
            // Not a JSON object
        }
        /**
         * TODO : Timestamp, ASCII, Binary and Bytes Array
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

    public static String jsonSmartReplacementQuestionWithValue(String input, String replacement) {
        DataType dataType = DataTypeStringUtils.stringToKnownDataTypeConverter(replacement);
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
                    input = questionPattern.matcher(input).replaceFirst(String.valueOf(objectMapper.writeValueAsString(jsonObject)));
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
            case DATE:
            case TIME:
            case ASCII:
            case BINARY:
            case BYTES:
            case STRING:
            default:
                try {
                    input = questionPattern.matcher(input).replaceFirst(objectMapper.writeValueAsString(replacement));
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

}
