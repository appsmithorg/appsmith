package com.appsmith.server.services;

import com.appsmith.external.services.EncryptionService;
import com.appsmith.server.configurations.EncryptionConfig;
import com.appsmith.server.services.ce.EncryptionServiceCEImpl;
import org.springframework.stereotype.Service;

@Service
public class EncryptionServiceImpl extends EncryptionServiceCEImpl implements EncryptionService {

    public EncryptionServiceImpl(EncryptionConfig encryptionConfig) {
        super(encryptionConfig);
    }
}
