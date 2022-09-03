package com.appsmith.external.datatypes;

import com.appsmith.external.constants.DataType;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import net.minidev.json.JSONArray;
import net.minidev.json.parser.JSONParser;
import reactor.core.Exceptions;

import java.util.List;

public class ArrayType implements AppsmithType {

    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final JSONParser parser = new JSONParser(JSONParser.MODE_PERMISSIVE);

    @Override
    public boolean test(String s) {
        final String trimmedValue = s.trim();

        if (trimmedValue.startsWith("[") && trimmedValue.endsWith("]")) {
            String betweenBraces = trimmedValue.substring(1, trimmedValue.length() - 1);
            String trimmedInputBetweenBraces = betweenBraces.trim();
            // In case of no values in the array, set this as null otherwise plugins like postgres and ms-sql
            // would break while creating a SQL array.
            if (!trimmedInputBetweenBraces.isEmpty()) {
                try {
                    new ObjectMapper().readValue(trimmedValue, List.class);
                    return true;
                } catch (JsonProcessingException e) {
                    return false;
                }

            }
        }

        return false;
    }

    @Override
    public String performSmartSubstitution(String s) {
        try {
            JSONArray jsonArray = (JSONArray) parser.parse(s);
            return objectMapper.writeValueAsString(jsonArray);
        } catch (net.minidev.json.parser.ParseException | JsonProcessingException e) {
            throw Exceptions.propagate(
                    new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR,
                            s,
                            e.getMessage()
                    )
            );
        }
    }

    @Override
    public DataType type() {
        return DataType.ARRAY;
    }
}
