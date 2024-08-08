package com.appsmith.external.helpers;

import com.appsmith.external.annotations.encryption.Encrypted;
import com.appsmith.external.views.Views;
import com.appsmith.util.SerializationUtils;
import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.introspect.Annotated;
import com.fasterxml.jackson.databind.introspect.AnnotatedField;
import com.fasterxml.jackson.databind.introspect.AnnotatedMember;
import com.fasterxml.jackson.databind.introspect.JacksonAnnotationIntrospector;
import com.fasterxml.jackson.databind.util.Converter;
import com.fasterxml.jackson.databind.util.StdConverter;
import jakarta.persistence.Transient;

/**
 * Owner of ObjectMapper configuration designed for serialization/deserialization of objects into/from the database.
 * 1. Use this ObjectMapper _only_ for operating with data on the database.
 * 2. Only use this ObjectMapper for operating with data on the database, and no other ObjectMapper.
 * It's a strict one-to-one relationship.
 */
public final class JsonForDatabase {

    /**
     * This is for internal use in this class only. For uses outside this class, use the `create()` method to create
     * your own. The reason we do this instead of using a single instance for all purposes is because these objects are
     * mutable, and are prone to configuration changes at any time. Other users of this object may choose to create a
     * private constant instance and reuse, like we do here, but we're not doing a global singleton.
     */
    private static final ObjectMapper objectMapper = create();

    private static final Converter<Object, String> encConverter = new StdConverter<>() {
        @Override
        public String convert(Object value) {
            // Ideally, this shouldn't be `Object`, it should be `String`. We need `Object` here for the
            // `AuthenticationResponse.tokenResponse` field, which also, may be should've been a JSON string instead.
            return EncryptionHelper.encrypt(String.valueOf(value));
        }
    };

    public static ObjectMapper create() {
        final ObjectMapper om = new ObjectMapper();
        SerializationUtils.configureObjectMapper(om);

        // We want to explicitly fail when deserializing JSON with unknown properties. Unless it's slowing us down
        // significantly, let's not remove it. It'll encourage clean data in the database and reduce future surprises.
        // If at all we decide to change this to `false`, it _has_ to be treated as debt, and paid off by changing it
        // back to `true`.
        om.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        om.setVisibility(om.getSerializationConfig()
                .getDefaultVisibilityChecker()
                .withFieldVisibility(JsonAutoDetect.Visibility.ANY)
                .withGetterVisibility(JsonAutoDetect.Visibility.NONE)
                .withIsGetterVisibility(JsonAutoDetect.Visibility.NONE)
                .withCreatorVisibility(JsonAutoDetect.Visibility.NONE));

        om.setAnnotationIntrospector(new CustomAnnotationIntrospector());

        return om.setConfig(om.getSerializationConfig().withView(Views.Internal.class));
    }

    public static String writeValueAsString(Object object) throws JsonProcessingException {
        return objectMapper.writeValueAsString(object);
    }

    private static final class CustomAnnotationIntrospector extends JacksonAnnotationIntrospector {
        @Override
        public boolean hasIgnoreMarker(AnnotatedMember m) {
            if (m.hasAnnotation(Transient.class)) {
                return true;
            }
            if (m.hasAnnotation(org.springframework.data.annotation.Transient.class)) {
                // This is the incorrect `@Transient` annotation to be used. Fail loud and clear.
                // throw new RuntimeException("Incorrect @Transient annotation on " + m.getFullName());
                return true;
            }
            return super.hasIgnoreMarker(m);
        }

        /**
         * For serialization, we use the converter, since the converter gets called for every class/field/method that's
         * about to be serialized.
         */
        @Override
        public Object findSerializationConverter(Annotated a) {
            if (a instanceof AnnotatedField && a.hasAnnotation(Encrypted.class)) {
                return encConverter;
            }
            return super.findSerializationConverter(a);
        }
    }
}
