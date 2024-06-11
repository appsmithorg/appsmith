package com.appsmith.external.helpers;

import org.apache.commons.lang3.StringUtils;
import org.springframework.security.crypto.encrypt.Encryptors;
import org.springframework.security.crypto.encrypt.TextEncryptor;

import java.util.HexFormat;

public final class EncryptionHelper {

    private static final String salt = requireEnv("APPSMITH_ENCRYPTION_SALT");

    private static final String password = requireEnv("APPSMITH_ENCRYPTION_PASSWORD");

    private static final HexFormat hexFormat = HexFormat.of();

    private static final TextEncryptor textEncryptor = makeTextEncryptor();

    private EncryptionHelper() {}

    private static TextEncryptor makeTextEncryptor() {
        final String saltInHex = hexFormat.formatHex(salt.getBytes());
        return Encryptors.delux(password, saltInHex);
    }

    public static String encrypt(String plaintext) {
        return textEncryptor.encrypt(plaintext);
    }

    public static String decrypt(String encryptedText) {
        return textEncryptor.decrypt(encryptedText);
    }

    private static String requireEnv(String name) {
        final String value = System.getenv(name);
        if (StringUtils.isBlank(value)) {
            throw new RuntimeException("Environment variable '%s' is required".formatted(name));
        }
        return value;
    }
}
