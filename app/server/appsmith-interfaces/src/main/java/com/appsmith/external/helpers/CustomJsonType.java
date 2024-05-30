package com.appsmith.external.helpers;

import com.appsmith.external.annotations.encryption.Encrypted;
import com.appsmith.external.annotations.encryption.EncryptionHandler;
import com.appsmith.external.models.AppsmithDomain;
import com.appsmith.external.views.Views;
import com.appsmith.util.SerializationUtils;
import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.introspect.Annotated;
import com.fasterxml.jackson.databind.introspect.AnnotatedField;
import com.fasterxml.jackson.databind.introspect.AnnotatedMember;
import com.fasterxml.jackson.databind.introspect.JacksonAnnotationIntrospector;
import com.fasterxml.jackson.databind.util.Converter;
import com.fasterxml.jackson.databind.util.StdConverter;
import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import io.hypersistence.utils.hibernate.type.util.ObjectMapperWrapper;
import jakarta.persistence.Transient;
import org.springframework.security.crypto.encrypt.Encryptors;
import org.springframework.security.crypto.encrypt.TextEncryptor;

import java.lang.reflect.Type;
import java.util.HexFormat;

/**
 * Extends the default JsonBinaryType to use a custom ObjectMapper for database serialization.
 * We do it this way, instead of customizing the ObjectMapper in the JsonBinaryType, as described in
 * <a href="https://vladmihalcea.com/hibernate-types-customize-jackson-objectmapper/">this article</a>, because that
 * doesn't work. It apparently works with _some_ versions of Spring / Spring Boot / Spring ORM, but this seemed a simpler
 * solution than hunting down the exact version that works.
 */
public final class CustomJsonType extends JsonBinaryType {

    public static final EncryptionHandler ENCRYPTION_HANDLER = new EncryptionHandler();

    private static final TextEncryptor textEncryptor = Encryptors.delux(
            System.getenv("APPSMITH_ENCRYPTION_PASSWORD"),
            HexFormat.of().formatHex(System.getenv("APPSMITH_ENCRYPTION_SALT").getBytes()));

    private static final Converter<String, String> encConverter = new StdConverter<>() {
        @Override
        public String convert(String value) {
            return textEncryptor.encrypt(value);
        }
    };

    public CustomJsonType() {
        super(new CustomWrapper());
    }

    private static ObjectMapper makeObjectMapperForDatabaseSerialization() {
        final ObjectMapper om = new ObjectMapper();
        SerializationUtils.configureObjectMapper(om);

        om.setVisibility(om.getSerializationConfig()
                .getDefaultVisibilityChecker()
                .withFieldVisibility(JsonAutoDetect.Visibility.ANY)
                .withGetterVisibility(JsonAutoDetect.Visibility.NONE)
                .withIsGetterVisibility(JsonAutoDetect.Visibility.NONE)
                .withCreatorVisibility(JsonAutoDetect.Visibility.NONE));

        om.setAnnotationIntrospector(new CustomAnnotationIntrospector());

        return om.setConfig(om.getSerializationConfig().withView(Views.Internal.class));
    }

    private static class CustomWrapper extends ObjectMapperWrapper {
        /**
         * The constant Object mapper used by this "wrapper". Do not make it {@code static}, as we need separate
         * wrapper objects to have separate `ObjectMapper` instances. Don't know the reason, but this is how
         * hypersistence-utils is built, and I don't see much reason to deviate.
         */
        private final ObjectMapper om = makeObjectMapperForDatabaseSerialization();

        @Override
        public ObjectMapper getObjectMapper() {
            return om;
        }

        /**
         * For deserialization, we can't use a converter, since the converter will only get a {@code LinkedHashMap} of
         * the JSON data object, without much information on what type it's about to turn into, which means we have no
         * way to find out which fields should be decrypted.
         * So instead, we override the serialization routines, let it figure out the deserialization to a map, and then
         * turning that map into an object instance, after which we just chip in to decrypt.
         */
        @Override
        public <T> T fromString(String string, Class<T> clazz) {
            return applyDecryption(super.fromString(string, clazz));
        }

        @Override
        public <T> T fromString(String string, Type type) {
            return applyDecryption(super.fromString(string, type));
        }

        @Override
        public <T> T fromBytes(byte[] value, Class<T> clazz) {
            return applyDecryption(super.fromBytes(value, clazz));
        }

        @Override
        public <T> T fromBytes(byte[] value, Type type) {
            return applyDecryption(super.fromBytes(value, type));
        }

        private <T> T applyDecryption(T obj) {
            if (AppsmithDomain.class.isAssignableFrom(obj.getClass())) {
                ENCRYPTION_HANDLER.convertEncryption(obj, textEncryptor::decrypt);
            }
            return obj;
        }
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
