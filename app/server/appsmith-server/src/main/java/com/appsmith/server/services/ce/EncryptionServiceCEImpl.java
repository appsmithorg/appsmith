package com.appsmith.server.services.ce;

import com.appsmith.external.services.ce.EncryptionServiceCE;
import com.appsmith.server.configurations.EncryptionConfig;
import org.apache.commons.codec.binary.Hex;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.encrypt.Encryptors;
import org.springframework.security.crypto.encrypt.TextEncryptor;


public class EncryptionServiceCEImpl implements EncryptionServiceCE {

    private final EncryptionConfig encryptionConfig;

    private TextEncryptor textEncryptor;

    @Autowired
    public EncryptionServiceCEImpl(EncryptionConfig encryptionConfig) {
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
