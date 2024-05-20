package com.appsmith.external.helpers;

import com.appsmith.external.views.Views;
import com.appsmith.util.SerializationUtils;
import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.introspect.AnnotatedMember;
import com.fasterxml.jackson.databind.introspect.JacksonAnnotationIntrospector;
import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.Transient;

/**
 * Extends the default JsonBinaryType to use a custom ObjectMapper for database serialization.
 * We do it this way, instead of customizing the ObjectMapper in the JsonBinaryType, as described in
 * <a href="https://vladmihalcea.com/hibernate-types-customize-jackson-objectmapper/">this article</a>, because that
 * doesn't work. It apparently works with _some_ versions of Spring / Spring Boot / Spring ORM, but this seemed a simpler
 * solution than hunting down the exact version that works.
 */
public final class CustomJsonType extends JsonBinaryType {

    public CustomJsonType() {
        super(makeObjectMapperForDatabaseSerialization());
    }

    private static ObjectMapper makeObjectMapperForDatabaseSerialization() {
        final ObjectMapper om = new ObjectMapper();

        om.setVisibility(om.getSerializationConfig()
                .getDefaultVisibilityChecker()
                .withFieldVisibility(JsonAutoDetect.Visibility.ANY)
                .withGetterVisibility(JsonAutoDetect.Visibility.NONE)
                .withIsGetterVisibility(JsonAutoDetect.Visibility.NONE)
                .withCreatorVisibility(JsonAutoDetect.Visibility.NONE));

        om.setAnnotationIntrospector(new CustomAnnotationIntrospector());

        return SerializationUtils.configureObjectMapper(om)
                .setConfig(om.getSerializationConfig().withView(Views.Internal.class));
    }

    private static final class CustomAnnotationIntrospector extends JacksonAnnotationIntrospector {
        @Override
        public boolean hasIgnoreMarker(AnnotatedMember m) {
            if (m.hasAnnotation(Transient.class)) {
                return true;
            }
            if (m.hasAnnotation(org.springframework.data.annotation.Transient.class)) {
                // This is the incorrect `@Transient` annotation to be used. Fail loud and clear.
                throw new RuntimeException("Incorrect @Transient annotation on " + m.getFullName());
            }
            return super.hasIgnoreMarker(m);
        }
    }
}
