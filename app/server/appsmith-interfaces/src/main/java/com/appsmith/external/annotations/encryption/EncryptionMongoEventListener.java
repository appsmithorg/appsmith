package com.appsmith.external.annotations.encryption;

import com.appsmith.external.services.EncryptionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.mapping.event.AbstractMongoEventListener;
import org.springframework.data.mongodb.core.mapping.event.AfterConvertEvent;
import org.springframework.data.mongodb.core.mapping.event.BeforeConvertEvent;

@Slf4j
public class EncryptionMongoEventListener<E> extends AbstractMongoEventListener<E> {

    private final EncryptionService encryptionService;
    EncryptionHandler encryptionHandler;

    public EncryptionMongoEventListener(EncryptionService encryptionService) {
        encryptionHandler = new EncryptionHandler();
        this.encryptionService = encryptionService;
    }

    // This lifecycle event is before we save a document into the DB,
    // and even before the mapper has converted the object into a document type
    @Override
    public void onBeforeConvert(BeforeConvertEvent<E> event) {
        E source = event.getSource();

        encryptionHandler.convertEncryption(source, encryptionService::encryptString);
    }

    // This lifecycle event is after we retrieve a document from the DB,
    // and the mapper has converted the document into the relevant object
    @Override
    public void onAfterConvert(AfterConvertEvent<E> event) {
        E source = event.getSource();

        encryptionHandler.convertEncryption(source, encryptionService::decryptString);
    }

}
