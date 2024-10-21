package com.appsmith.server.helpers.ce;

import org.springframework.util.CollectionUtils;

import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;

public class ReflectionHelpers {

    /**
     * Maps a tuple to an object of the given type using the constructor of the type. The order of the tuple should be
     * the same as the order of the fields in the type constructor.
     * @param type          The type of the object to be created
     * @param tuple         The tuple to be mapped to the object
     * @param tupleTypes    The types of the tuple elements. If not provided, the types of the fields of the type are used.
     *
     * @return      The object of the given type
     * @param <T>   The type of the object to be created
     */
    private static <T> T map(Object[] tuple, Class<T> type, List<Class<?>> tupleTypes) {
        if (CollectionUtils.isEmpty(tupleTypes)) {
            tupleTypes = new ArrayList<>();
            for (Field field : type.getDeclaredFields()) {
                tupleTypes.add(field.getType());
            }
        }
        try {
            Constructor<T> constructor = type.getConstructor(tupleTypes.toArray(new Class<?>[tuple.length]));
            return constructor.newInstance(tuple);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public static <T> T map(Object[] tuple, Class<T> type) {
        return map(tuple, type, null);
    }

    /**
     * Maps a list of tuples to a list of objects of the given type using the constructor of the type.
     * @param type      The type of the object to be created
     * @param records   The list of tuples to be mapped to the objects
     *
     * @return      The list of objects of the given type
     * @param <T>   The type of the object to be created
     */
    public static <T> List<T> map(List<Object[]> records, Class<T> type) {
        List<T> result = new ArrayList<>();
        List<Class<?>> tupleTypes = new ArrayList<>();
        for (Field field : type.getDeclaredFields()) {
            tupleTypes.add(field.getType());
        }
        for (Object[] record : records) {
            result.add(map(record, type, tupleTypes));
        }
        return result;
    }
}
