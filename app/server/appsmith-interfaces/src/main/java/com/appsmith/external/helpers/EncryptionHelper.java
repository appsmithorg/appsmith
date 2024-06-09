package com.appsmith.external.helpers;

import org.springframework.security.crypto.encrypt.Encryptors;
import org.springframework.security.crypto.encrypt.TextEncryptor;

import java.util.HexFormat;

public final class EncryptionHelper {

    private static final String salt = System.getProperty("encrypt.salt");

    private static final String password = System.getProperty("encrypt.password");

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
}
