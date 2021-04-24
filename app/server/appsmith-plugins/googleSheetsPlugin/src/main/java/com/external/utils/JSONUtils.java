package com.external.utils;

import com.google.gson.GsonBuilder;

import java.util.List;
import java.util.Map;

public class JSONUtils {

    /**
     * Given a JSON string, we infer the top-level type of the object it represents and then parse it into that
     * type. However, only `Map` and `List` top-levels are supported. Note that the map or list may contain
     * anything, like booleans or number or even more maps or lists. It's only that the top-level type should be a
     * map / list.
     *
     * @param jsonString A string that confirms to JSON syntax. Shouldn't be null.
     */
    public static void objectFromJson(String jsonString) {
        Class<?> type;
        String trimmed = jsonString.trim();

        if (trimmed.startsWith("{")) {
            type = Map.class;
        } else if (trimmed.startsWith("[")) {
            type = List.class;
        } else {
            // The JSON body is likely a literal boolean or number or string. For our purposes here, we don't have
            // to parse this JSON.
            return;
        }

        new GsonBuilder().create().fromJson(jsonString, type);
    }
}
