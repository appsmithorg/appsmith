package com.appsmith.server.helpers.ce;

import com.appsmith.server.dtos.FieldInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.util.CollectionUtils;

import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Map;

import static com.appsmith.external.helpers.StringUtils.dotted;
import static com.appsmith.server.helpers.AppsmithClassUtils.isAppsmithDefinedClass;
import static com.appsmith.server.helpers.AppsmithClassUtils.isAppsmithProjections;
import static org.modelmapper.internal.util.Primitives.isPrimitiveWrapper;

public class ReflectionHelpers {

    private static final ObjectMapper objectMapper = new ObjectMapper();

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
    private static <T> T map(ArrayList<Object> tuple, Class<T> type, List<Class<?>> tupleTypes) {
        if (CollectionUtils.isEmpty(tupleTypes)) {
            tupleTypes = fetchAllFields(type);
        }
        try {
            // Create a deep copy of the tuple
            ArrayList<Object> modified = new ArrayList<>(tuple.size());
            for (Class<?> tupleType : tupleTypes) {
                boolean fromProjectionPackage = tupleType.getPackageName().matches(".*appsmith.*projections");
                // Detect if the tupleType is userDefined
                if (fromProjectionPackage) {
                    modified.add(map(tuple, tupleType, null));
                } else {
                    Object value =
                            tuple.get(0) != null && (isCollectionType(tupleType) || isAppsmithDefinedClass(tupleType))
                                    ? objectMapper.readValue(tuple.get(0).toString(), tupleType)
                                    : tuple.get(0);
                    modified.add(value);
                    // Drop the first element from tuple as it has been used
                    tuple.remove(0);
                }
            }
            Constructor<T> constructor = type.getConstructor(tupleTypes.toArray(new Class<?>[0]));
            return constructor.newInstance(modified.toArray());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public static <T> T map(Object[] tuple, Class<T> type) {
        ArrayList<Object> update = new ArrayList<>(Arrays.asList(tuple));
        return map(update, type, null);
    }

    /**
     * Maps a list of tuples to a list of objects of the given type using the constructor of the type.
     * @param clazz     The type of the object to be created
     * @param records   The list of tuples to be mapped to the objects
     *
     * @return      The list of objects of the given type
     * @param <T>   The type of the object to be created
     */
    public static <T> List<T> map(List<Object[]> records, Class<T> clazz) {
        List<T> result = new ArrayList<>();
        List<Class<?>> tupleTypes = fetchAllFields(clazz);
        for (Object[] record : records) {
            ArrayList<Object> update = new ArrayList<>(Arrays.asList(record));
            result.add(map(update, clazz, tupleTypes));
        }
        return result;
    }

    // Method to fetch fields from a class including its superclasses
    private static List<Class<?>> fetchAllFields(Class<?> clazz) {
        List<Class<?>> tupleTypes = new ArrayList<>();

        // Traverse the class hierarchy to get fields from the class and its superclasses
        while (clazz != null) {
            // Get declared fields from the current class
            for (Field field : clazz.getDeclaredFields()) {
                // Ensure access to private fields
                field.setAccessible(true);
                tupleTypes.add(field.getType());
            }
            // Move to the superclass
            clazz = clazz.getSuperclass();
        }

        return tupleTypes;
    }

    private static boolean isCollectionType(Class<?> clazz) {
        // Check if the class is a subtype of Collection or Map
        return Collection.class.isAssignableFrom(clazz) || Map.class.isAssignableFrom(clazz);
    }

    public static List<FieldInfo> extractFieldPaths(Class<?> projectionClass) {
        List<FieldInfo> fieldPaths = new ArrayList<>();
        extractFieldPathsRecursively(projectionClass, "", fieldPaths);
        return fieldPaths;
    }

    private static void extractFieldPathsRecursively(Class<?> clazz, String parentPath, List<FieldInfo> fieldPaths) {
        // Process the class and its superclasses
        while (clazz != null && clazz != Object.class) {
            for (Field field : clazz.getDeclaredFields()) {
                field.setAccessible(true); // Ensure access to private fields
                String fieldName = field.getName();
                String fullPath = parentPath.isEmpty() ? fieldName : dotted(parentPath, fieldName);

                if (!isAppsmithDefinedClass(field.getType()) || !isAppsmithProjections(field.getType())) {
                    // Check if the field type is part of JdbcType.getDdlTypeCode if not assign the Object as the type
                    if (isPrimitiveWrapper(field.getType()) || String.class.equals(field.getType())) {
                        fieldPaths.add(new FieldInfo(fullPath, field.getType()));
                    } else {
                        fieldPaths.add(new FieldInfo(fullPath, Object.class));
                    }
                } else {
                    // Recursively extract nested fields for complex types
                    extractFieldPathsRecursively(field.getType(), fullPath, fieldPaths);
                }
            }
            // Move to superclass (if any)
            clazz = clazz.getSuperclass();
        }
    }
}
