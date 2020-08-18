package com.appsmith.server.helpers;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

public class CollectionUtils {

    private CollectionUtils() {
        // This class is not supposed to be initialized. Only static public/private methods should be defined.
    }

    /**
     * Takes an array/variadic collection of maps and returns an unmodifiable map that contains key-value pairs from
     * all the given maps. Repeating keys will get values from later maps in the given array of maps.
     * @param maps Collection of maps to be merged.
     * @return An unmodifiable map with key-value pairs from all the given maps.
     */
    @SafeVarargs
    public static <K, V> Map<K, V> mergeMaps(final Map<K, V>... maps) {
        final Map<K, V> merged = new HashMap<>();

        for (Map<K, V> map : maps) {
            merged.putAll(map);
        }

        return Collections.unmodifiableMap(merged);
    }

}
