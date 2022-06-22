package com.appsmith.git.converters;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonSerializationContext;
import com.google.gson.JsonSerializer;
import org.springframework.util.CollectionUtils;

import javax.lang.model.type.PrimitiveType;
import java.lang.reflect.Type;
import java.util.Collection;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.stream.Collectors;

public class GsonUnorderedToOrderedConverter<T> implements JsonSerializer<T> {
    @Override
    public JsonElement serialize(T src, Type typeOfSrc, JsonSerializationContext context) {
        // Sort the set so that same elements will not end up in merge conflicts
        Gson gson = new Gson();
        if (src instanceof Set) {
            return gson.toJsonTree(getOrderedResource((Set<?>) src));
        }
        else if (src instanceof Map) {
            return gson.toJsonTree(new TreeMap<>((Map<?, ?>) src));
        }
        return (JsonElement) src;
    }

    /**
     * Sort the primitive AppsmithType objects and string so that we will have predictable sorted output
     * e.g. Input => ["abcd", "abc", "abcd1", "1abcd","xyz", "1xyz", "0xyz"]
     * Output => ["0xyz","1abcd","1xyz","abc","abcd","abcd1","xyz"]
     *
     * @param objects set of objects which needs to be sorted before serialisation
     * @param <T>
     * @return sorted collection
     */
    private <T> Collection<T> getOrderedResource(Collection<T> objects) {
        if (!CollectionUtils.isEmpty(objects)) {
            T element = objects.iterator().next();
            if (element instanceof String || element instanceof PrimitiveType) {
                return objects.stream().sorted().collect(Collectors.toList());
            }
        }
        return objects;
    }
}
