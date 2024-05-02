package com.appsmith.external.converters;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.ser.std.StdSerializer;
import jakarta.persistence.Transient;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 *  This class is used to serialize the entity object by ignoring the fields annotated with @Transient. We need
 *  the custom serializer here as the columns with `jsonb` type is not able to ignore the fields annotated with
 *  @Transient by default.
 */
@Slf4j
public class TransientAnnotationSerializer<T> extends StdSerializer<T> {

    public TransientAnnotationSerializer() {
        this(null);
    }

    public TransientAnnotationSerializer(Class<T> t) {
        super(t);
    }

    @Override
    public void serialize(T value, JsonGenerator gen, SerializerProvider provider) throws IOException {
        if (value == null) {
            return;
        }

        List<Field> allFields = getAllFields(value.getClass());

        gen.writeStartObject();
        for (final Field field : allFields) {
            field.setAccessible(true);
            if (field.isAnnotationPresent(Transient.class)) {
                continue;
            }
            try {
                gen.writeObjectField(field.getName(), field.get(value));
            } catch (IllegalAccessException e) {
                log.error("Error serializing field: {}", field.getName(), e);
            }
        }
        gen.writeEndObject();
    }

    // Method to get all fields including superclasses
    private List<Field> getAllFields(Class<?> clazz) {
        List<Field> fields =
                new ArrayList<>(Arrays.stream(clazz.getDeclaredFields()).toList());
        Class<?> superClass = clazz.getSuperclass();
        if (superClass != null && !superClass.equals(Object.class)) {
            fields.addAll(getAllFields(superClass));
        }
        return fields;
    }
}
