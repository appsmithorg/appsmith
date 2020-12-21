package com.appsmith.server.services;

import com.appsmith.server.configurations.EncryptionConfig;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.binary.Hex;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.encrypt.Encryptors;
import org.springframework.security.crypto.encrypt.TextEncryptor;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EncryptionServiceImpl implements EncryptionService {
    private final TextEncryptor textEncryptor;

    @Autowired
    public EncryptionServiceImpl(EncryptionConfig encryptionConfig) {
        String saltInHex = Hex.encodeHexString(encryptionConfig.getSalt().getBytes());
        this.textEncryptor = Encryptors.queryableText(encryptionConfig.getPassword(), saltInHex);
    }

    @Override
    public String encryptString(String plaintext) {
        return textEncryptor.encrypt(plaintext);
    }

    @Override
    public String decryptString(String encryptedText) {
        try {
            return textEncryptor.decrypt(encryptedText);
        } catch (IllegalArgumentException e) {
            log.error("Error trying to decrypt an incorrectly encrypted or non-encrypted string '{}'.", encryptedText);
            return encryptedText;
        }
    }
}
