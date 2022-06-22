package com.appsmith.external.helpers;

import com.appsmith.external.constants.DisplayAppsmithType;
import com.appsmith.external.datatypes.AppsmithType;
import com.appsmith.external.models.ParsedAppsmithType;
import com.appsmith.external.plugins.SmartSubstitutionInterface;
import com.appsmith.external.services.DatatypeService;
import com.appsmith.external.services.DatatypeServiceImpl;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.parser.JSONParser;

import java.io.IOException;
import java.util.AbstractMap.SimpleEntry;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import static com.appsmith.external.helpers.SmartSubstitutionHelper.APPSMITH_SUBSTITUTION_PLACEHOLDER;
import static org.apache.commons.lang3.ClassUtils.isPrimitiveOrWrapper;

@Slf4j
public class DataTypeStringUtils {

    private static final Pattern placeholderPattern = Pattern.compile(APPSMITH_SUBSTITUTION_PLACEHOLDER);

    private static final ObjectMapper objectMapper = new ObjectMapper();

    private static final JSONParser parser = new JSONParser(JSONParser.MODE_PERMISSIVE);

    private static final DatatypeService datatypeService = DatatypeServiceImpl.getInstance();

    /**
     * @param input                  input string which has a mustache expression that will be substituted by the replacement value
     * @param replacement            value that needs to be substituted in place of mustache expression
     * @param possibleTypes          list of data types that is valid for that particular integration.
     *                               If null or empty, default data types will be used
     * @param insertedParams         keeps a list of tuple (replacement, data_type)
     * @param smartSubstitutionUtils provides entry to plugin specific post-processing logic applied to replacement
     *                               value before the final substitution happens
     * @return
     */
    public static String jsonSmartReplacementPlaceholderWithValue(String input,
                                                                  String replacement,
                                                                  List<AppsmithType> possibleTypes,
                                                                  List<Map.Entry<String, Class<?>>> insertedParams,
                                                                  SmartSubstitutionInterface smartSubstitutionUtils) {

        final AppsmithType datatype;
        if (possibleTypes == null || possibleTypes.isEmpty()) {
            datatype = datatypeService.getAppsmithType(replacement);
        } else {
            datatype = datatypeService.getAppsmithType(replacement, possibleTypes);
        }

        Map.Entry<String, Class<?>> parameter = new SimpleEntry<>(replacement, datatype.getClass());
        insertedParams.add(parameter);

        String updatedReplacement = datatype.performSmartSubstitution(replacement);

        if (smartSubstitutionUtils != null) {
            updatedReplacement = smartSubstitutionUtils.sanitizeReplacement(updatedReplacement, datatype);
        }

        input = placeholderPattern.matcher(input).replaceFirst(updatedReplacement);
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

    private static boolean isDisplayTypeTable(Object data) {
        if (data instanceof List) {
            // Check if the data is a list of json objects
            return ((List) data).stream()
                    .allMatch(item -> item instanceof Map);
        } else if (data instanceof JsonNode) {
            // Check if the data is an array of json objects
            try {
                objectMapper.convertValue(data, new TypeReference<List<Map<String, Object>>>() {
                });
                return true;
            } catch (IllegalArgumentException e) {
                return false;
            }
        } else if (data instanceof String) {
            // Check if the data is an array of json objects
            try {
                objectMapper.readValue((String) data, new TypeReference<List<Map<String, Object>>>() {
                });
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
        } else if (data instanceof String) {
            try {
                objectMapper.readTree((String) data);
                return true;
            } catch (IOException e) {
                return false;
            }
        }

        return false;
    }

    public static List<ParsedAppsmithType> getDisplayAppsmithTypes(Object data) {

        if (data == null) {
            return new ArrayList<>();
        }

        List<ParsedAppsmithType> AppsmithTypes = new ArrayList<>();

        // Check if the data is a valid table.
        if (isDisplayTypeTable(data)) {
            AppsmithTypes.add(new ParsedAppsmithType(DisplayAppsmithType.TABLE));
        }

        // Check if the data is a valid json.
        if (isDisplayTypeJson(data)) {
            AppsmithTypes.add(new ParsedAppsmithType(DisplayAppsmithType.JSON));
        }

        // All data types can be categorized as raw by default.
        AppsmithTypes.add(new ParsedAppsmithType(DisplayAppsmithType.RAW));

        return AppsmithTypes;
    }
}
