package com.appsmith.external.annotations.encryption;

import com.appsmith.external.helpers.EncryptionHelper;
import jakarta.persistence.PostLoad;
import jakarta.persistence.PrePersist;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * This isn't used today. Encryption/decryption with Postgres, only happens for nested fields in JSONB columns, and
 * is handled in the {@link com.fasterxml.jackson.databind.ObjectMapper} directly, as part of
 * {@link com.appsmith.external.helpers.CustomJsonType}.
 * Yet the code is kept for now, as we potentially may have to revisit, when we need to have encryption/decryption for
 * top-level fields in entity classes, since Jackson can't help there.
 */
@Component
@SuppressWarnings(
        // Can't fix this since it's the only way to autowire beans for entity listeners.
        "SpringJavaAutowiredFieldsWarningInspection")
public class EncryptionEntityListener {

    @PrePersist
    public void prePersist(Object entity) {
        new EncryptionHandler().convertEncryption(entity, EncryptionHelper::encrypt);
    }

    @PostLoad
    public void postLoad(Object entity) {
        new EncryptionHandler().convertEncryption(entity, EncryptionHelper::decrypt);
    }
}
