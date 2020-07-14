package com.appsmith.server.services;

public interface EncryptionService {
    String encryptString(String plaintext);

    String decryptString(String encryptedText);
}
