package com.appsmith.server.services;

import com.appsmith.server.configurations.EncryptionConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.encrypt.Encryptors;
import org.springframework.security.crypto.encrypt.TextEncryptor;
import org.springframework.stereotype.Service;

@Service
public class EncryptionServiceImpl implements EncryptionService {
    private final EncryptionConfig encryptionConfig;

    private TextEncryptor textEncryptor;

    @Autowired
    public EncryptionServiceImpl(EncryptionConfig encryptionConfig) {
        this.encryptionConfig = encryptionConfig;
        this.textEncryptor = Encryptors.queryableText(encryptionConfig.getPassword(),
                encryptionConfig.getSalt());
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
