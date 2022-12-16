package com.appsmith.external.datatypes;

import com.appsmith.external.constants.DataType;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonSyntaxException;
import com.google.gson.TypeAdapter;
import com.google.gson.stream.JsonReader;
import net.minidev.json.JSONObject;
import net.minidev.json.parser.JSONParser;
import reactor.core.Exceptions;

import java.io.IOException;
import java.io.StringReader;
import java.util.regex.Matcher;

public class JsonObjectType implements AppsmithType {

    private static final TypeAdapter<JsonObject> strictGsonObjectAdapter =
            new Gson().getAdapter(JsonObject.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final JSONParser parser = new JSONParser(JSONParser.MODE_PERMISSIVE);

    @Override
    public boolean test(String s) {
        try (JsonReader reader = new JsonReader(new StringReader(s))) {
            strictGsonObjectAdapter.read(reader);
            reader.hasNext(); // throws on multiple top level values
            return true;
        } catch (IOException | JsonSyntaxException e) {
            // Not a strict JSON object
        }

        return false;
    }

    @Override
    public String performSmartSubstitution(String s) {
        try {
            JSONObject jsonObject = (JSONObject) parser.parse(s);
            String jsonString = objectMapper.writeValueAsString(jsonObject);
            // Adding Matcher.quoteReplacement so that "/" and "$" in the string are escaped during replacement
            return Matcher.quoteReplacement(jsonString);
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
        return DataType.JSON_OBJECT;
    }
}
