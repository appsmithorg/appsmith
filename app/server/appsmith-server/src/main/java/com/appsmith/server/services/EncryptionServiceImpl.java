package com.appsmith.server.services;

import com.appsmith.server.configurations.EncryptionConfig;
import org.apache.commons.codec.binary.Hex;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.encrypt.Encryptors;
import org.springframework.security.crypto.encrypt.TextEncryptor;
import org.springframework.stereotype.Service;

import java.math.BigInteger;

@Service
public class EncryptionServiceImpl implements EncryptionService {
    private final EncryptionConfig encryptionConfig;

    private TextEncryptor textEncryptor;

    @Autowired
    public EncryptionServiceImpl(EncryptionConfig encryptionConfig) {
        this.encryptionConfig = encryptionConfig;
        String saltInHex = Hex.encodeHexString(encryptionConfig.getSalt().getBytes());
        this.textEncryptor = Encryptors.queryableText(encryptionConfig.getPassword(),
                saltInHex);
    }

    @Override
    public String encryptString(String plaintext) {
        return textEncryptor.encrypt(plaintext);
    }

    @Override
    public String decryptString(String encryptedText) {
        return textEncryptor.decrypt(encryptedText);
    }
}
