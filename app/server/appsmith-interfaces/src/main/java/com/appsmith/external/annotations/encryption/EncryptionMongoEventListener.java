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

        log.debug("onBeforeConvert for {}", event.getDocument());
        log.debug("onBeforeConvert for {}", source);
    }

    // This lifecycle event is after we retrieve a document from the DB,
    // and the mapper has converted the document into the relevant object
    @Override
    public void onAfterConvert(AfterConvertEvent<E> event) {
        E source = event.getSource();

        encryptionHandler.convertEncryption(source, encryptionService::decryptString);

        // At this point the list represents all possible candidate fields
        // All we need to do is iterate through this list
        // and encrypt the field if it is an annotation type
        // or go deeper if it is an appsmith type
        log.debug("onAfterConvert for {}", event.getDocument());
        log.debug("onAfterConvert for {}", source);
    }

}
