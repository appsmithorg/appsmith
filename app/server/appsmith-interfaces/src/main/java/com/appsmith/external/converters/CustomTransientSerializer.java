package com.appsmith.external.converters;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.ser.std.StdSerializer;
import jakarta.persistence.Transient;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.lang.reflect.Field;
import java.util.List;

import static com.appsmith.external.helpers.ReflectionHelpers.getAllFields;

/**
 *  This class is used to serialize the entity object by ignoring the fields annotated with @Transient. We need
 *  the custom serializer here as the nested fields within the columns with `jsonb` type is not able to ignore the
 *  fields annotated with `@Transient` by default.
 */
@Slf4j
public class CustomTransientSerializer<T> extends StdSerializer<T> {

    public CustomTransientSerializer() {
        this(null);
    }

    public CustomTransientSerializer(Class<T> t) {
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
            try {
                if (field.isAnnotationPresent(Transient.class) || field.get(value) == null) {
                    continue;
                }
                gen.writeObjectField(field.getName(), field.get(value));
            } catch (IllegalAccessException e) {
                log.error("Error serializing field: {}", field.getName(), e);
            }
        }
        gen.writeEndObject();
    }
}
