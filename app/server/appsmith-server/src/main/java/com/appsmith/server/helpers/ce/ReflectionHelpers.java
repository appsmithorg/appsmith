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
     * Maps objects to the given type using the constructor of the type. The order of the objects should be the same as
     * the order of the fields in the type constructor.
     * @param objects       The objects to be mapped to the type. This holds the values of the fields of type objectTypes
     * @param type          The type of the object to be created
     * @param objectTypes    The types of the objects elements. If not provided, the types of the fields of the type are
     *                      used.
     *
     * @return      The object of the given type
     * @param <T>   The type of the object to be created
     */
    private static <T> T map(ArrayList<Object> objects, Class<T> type, List<Class<?>> objectTypes) {
        if (CollectionUtils.isEmpty(objectTypes)) {
            objectTypes = fetchAllFieldTypes(type);
        }
        try {
            // Create a deep copy of the objects
            ArrayList<Object> modified = new ArrayList<>(objects.size());
            for (Class<?> objectType : objectTypes) {
                // In case of Appsmith based projection loop through each field to avoid mapping all the fields from
                // the entity class
                // e.g. class EntityClass {
                //       private String field1;
                //       private String field2;
                //     }
                //     class ProjectionClass {
                //       private String field1;
                //     }
                // In the above example, we only need to map field1 from EntityClass to ProjectionClass. This is
                // because in the objects param we expect only field1 value to be present.
                if (isAppsmithProjections(objectType)) {
                    modified.add(map(objects, objectType, null));
                } else {
                    Object value = objects.get(0) != null
                                    && (isCollectionType(objectType) || isAppsmithDefinedClass(objectType))
                            ? objectMapper.readValue(objectMapper.writeValueAsString(objects.get(0)), objectType)
                            : objects.get(0);
                    modified.add(value);
                    // Drop the first element from objects as it has been processed
                    objects.remove(0);
                }
            }
            Constructor<T> constructor = type.getConstructor(objectTypes.toArray(new Class<?>[0]));
            return constructor.newInstance(modified.toArray());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Maps a row from the database to an object of the given type using the constructor of the type.
     * @param row   The row to be mapped to the object
     * @param type  The type of the object to be created
     *
     * @return    The object of the given type
     * @param <T>   The type of the object to be created
     */
    public static <T> T map(Object[] row, Class<T> type) {
        ArrayList<Object> update = new ArrayList<>(Arrays.asList(row));
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
        // In case of multiple records avoid fetching the field types for each record
        List<Class<?>> fieldTypes = fetchAllFieldTypes(clazz);
        for (Object[] record : records) {
            ArrayList<Object> update = new ArrayList<>(Arrays.asList(record));
            result.add(map(update, clazz, fieldTypes));
        }
        return result;
    }

    /**
     * Fetches all the field types of a class and its superclasses.
     * @param clazz The class whose field types are to be fetched
     *
     * @return  The list of field types
     */
    private static List<Class<?>> fetchAllFieldTypes(Class<?> clazz) {
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

    /**
     * Check if the class is a Java container class e.g. List, Set, Map etc.
     * @param clazz The class to be checked
     *
     * @return  True if the class is a container class, false otherwise
     */
    private static boolean isCollectionType(Class<?> clazz) {
        // Check if the class is a subtype of Collection or Map
        return Collection.class.isAssignableFrom(clazz) || Map.class.isAssignableFrom(clazz);
    }

    /**
     * Extracts all the field paths along-with the field type of the projection class.
     * @param projectionClass The projection class whose field paths are to be extracted
     *
     * @return  The list of field paths
     */
    public static List<FieldInfo> extractFieldPaths(Class<?> projectionClass) {
        List<FieldInfo> fieldPaths = new ArrayList<>();
        List<Class<?>> visitedClasses = new ArrayList<>();
        extractFieldPathsRecursively(projectionClass, "", fieldPaths, visitedClasses);
        return fieldPaths;
    }

    private static void extractFieldPathsRecursively(
            Class<?> clazz, String parentPath, List<FieldInfo> fieldPaths, List<Class<?>> visitedClasses) {
        // Check if the class has already been visited to prevent cyclic dependencies
        if (visitedClasses.contains(clazz)) {
            String cyclicChain = String.join(
                    " -> ", visitedClasses.stream().map(Class::getName).toArray(String[]::new));
            throw new RuntimeException("Cyclical dependency detected for: " + cyclicChain);
        }
        // Process the class and its superclasses
        while (clazz != null && clazz != Object.class) {
            for (Field field : clazz.getDeclaredFields()) {
                field.setAccessible(true); // Ensure access to private fields
                String fieldName = field.getName();
                String fullPath = parentPath.isEmpty() ? fieldName : dotted(parentPath, fieldName);
                Class<?> fieldType = field.getType();

                if (isAppsmithProjections(fieldType)) {
                    visitedClasses.add(fieldType);
                    extractFieldPathsRecursively(field.getType(), fullPath, fieldPaths, visitedClasses);
                } else {
                    // Check if the field type is part of JdbcType.getDdlTypeCode if not assign the Object as the type
                    if (isPrimitiveWrapper(field.getType()) || String.class.equals(field.getType())) {
                        fieldPaths.add(new FieldInfo(fullPath, field.getType()));
                    } else {
                        fieldPaths.add(new FieldInfo(fullPath, Object.class));
                    }
                }
            }
            // Move to superclass (if any)
            clazz = clazz.getSuperclass();
        }
        // Remove the class from the visited set to allow revisiting in different branches
        visitedClasses.remove(clazz);
    }
}
