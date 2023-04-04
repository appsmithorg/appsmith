package com.appsmith.server.serializers;

import java.io.IOException;
import java.lang.reflect.Type;

import com.appsmith.external.views.Views;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.interfaces.PublishableResource;
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.BeanDescription;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.ser.BeanSerializerFactory;

public final class ExportSerializer<T extends PublishableResource> extends JsonSerializer<T> {

    @Override
    public void serialize(T value, JsonGenerator gen, SerializerProvider serializers) throws IOException {
        gen.writeStartObject();

        // Serialize all the properties of the NewPage object
        serializeAllProperties(value, gen, serializers);

        // Serialize the page object
        gen.writeFieldName("page");
        if(serializers.getActiveView() == Views.ExportUnpublished.class) {
            serializers.defaultSerializeValue(value.select(ResourceModes.EDIT), gen);
        } else if(serializers.getActiveView() == Views.ExportPublished.class) {
            serializers.defaultSerializeValue(value.select(ResourceModes.VIEW), gen);
        } else {
            throw new RuntimeException("Invalid view");
        }

        gen.writeEndObject();
    }

    protected void serializeAllProperties(T value, JsonGenerator generator, SerializerProvider provider)
            throws JsonMappingException, IOException {
        Type type = new TypeReference<T>() {}.getType();
        JavaType javaType = provider.constructType(type);
        BeanDescription beanDesc = provider.getConfig().introspect(javaType);
        JsonSerializer<Object> serializer = BeanSerializerFactory.instance.findBeanOrAddOnSerializer(provider, javaType, beanDesc, false);
        serializer.unwrappingSerializer(null).serialize(value, generator, provider);
    }
}