package com.appsmith.external.helpers;

import com.appsmith.external.annotations.encryption.EncryptionHandler;
import com.appsmith.external.models.AppsmithDomain;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import io.hypersistence.utils.hibernate.type.util.ObjectMapperWrapper;
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

    public CustomJsonType() {
        super(new CustomWrapper());
    }

    private static class CustomWrapper extends ObjectMapperWrapper {
        /**
         * The constant Object mapper used by this "wrapper". Do not make it {@code static}, as we need separate
         * wrapper objects to have separate `ObjectMapper` instances. Don't know the reason, but this is how
         * hypersistence-utils is built, and I don't see much reason to deviate.
         */
        private final ObjectMapper om = JsonForDatabase.create();

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
}
