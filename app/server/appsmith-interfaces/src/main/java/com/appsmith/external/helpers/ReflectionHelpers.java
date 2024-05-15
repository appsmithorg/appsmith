package com.appsmith.external.helpers;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class ReflectionHelpers {
    /**
     * Returns all fields of the given class including the fields of the super classes.
     * @param clazz The class whose fields are to be returned
     *
     * @return  The list of fields of the given class
     */
    public static List<Field> getAllFields(Class<?> clazz) {
        List<Field> fields =
                new ArrayList<>(Arrays.stream(clazz.getDeclaredFields()).toList());
        Class<?> superClass = clazz.getSuperclass();
        if (superClass != null && !superClass.equals(Object.class)) {
            fields.addAll(getAllFields(superClass));
        }
        return fields;
    }
}
