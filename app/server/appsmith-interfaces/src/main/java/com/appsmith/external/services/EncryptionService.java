package com.appsmith.external.services;

public interface EncryptionService {
    String encryptString(String plaintext);

    String decryptString(String encryptedText);
}
