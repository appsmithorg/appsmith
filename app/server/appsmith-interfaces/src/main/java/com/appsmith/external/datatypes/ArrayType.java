package com.appsmith.external.datatypes;

import com.appsmith.external.constants.DataType;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import net.minidev.json.JSONArray;
import net.minidev.json.parser.JSONParser;
import reactor.core.Exceptions;

public class ArrayType implements AppsmithType {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public boolean test(String s) {
        final String trimmedValue = s.trim();

        return (trimmedValue.startsWith("[") && trimmedValue.endsWith("]"));
    }

    @Override
    public String performSmartSubstitution(String s) {
        JSONParser parser = new JSONParser(JSONParser.MODE_PERMISSIVE);

        try {
            JSONArray jsonArray = (JSONArray) parser.parse(s);
            return objectMapper.writeValueAsString(jsonArray);
        } catch (net.minidev.json.parser.ParseException | JsonProcessingException e) {
            throw Exceptions.propagate(
                    new AppsmithPluginException(AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR, s, e.getMessage()));
        }
    }

    @Override
    public DataType type() {
        return DataType.ARRAY;
    }
}
