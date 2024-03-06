package com.appsmith.external.annotations.encryption;

import com.appsmith.external.services.EncryptionService;
import jakarta.persistence.PrePersist;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
@SuppressWarnings(
        // Can't fix this since it's the only way to autowire beans for entity listeners.
        "SpringJavaAutowiredFieldsWarningInspection")
public class EncryptionEntityListener {

    @Autowired
    private EncryptionService encryptionService;

    @PrePersist
    public void prePersist(Object entity) {
        new EncryptionHandler().convertEncryption(entity, encryptionService::encryptString);
    }
}
