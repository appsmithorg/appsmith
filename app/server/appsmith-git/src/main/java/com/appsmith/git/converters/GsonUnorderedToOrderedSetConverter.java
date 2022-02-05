package com.appsmith.git.converters;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonSerializationContext;
import com.google.gson.JsonSerializer;
import org.springframework.util.CollectionUtils;

import javax.lang.model.type.PrimitiveType;
import java.lang.reflect.Type;
import java.util.Collection;
import java.util.Set;
import java.util.stream.Collectors;

public class GsonUnorderedToOrderedSetConverter implements JsonSerializer<Set> {
    @Override
    public JsonArray serialize(Set src, Type typeOfSrc, JsonSerializationContext context) {
        // Sort the set so that same elements will not end up in merge conflicts
        return (JsonArray) new Gson().toJsonTree(getOrderedResource(src));
    }

    /**
     * Sort the primitive datatype objects and string so that we will have predictable output
     * @param objects set of objects which needs to be sorted before serialisation
     * @param <T>
     * @return sorted collection
     */
    private <T> Collection<T> getOrderedResource(Set<T> objects) {
        if (!CollectionUtils.isEmpty(objects)) {
            T element = objects.iterator().next();
            if (element instanceof String || element instanceof PrimitiveType) {
                return objects.stream().sorted().collect(Collectors.toList());
            }
        }
        return objects;
    }
}
