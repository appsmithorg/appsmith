package com.appsmith.server.services;

import com.appsmith.server.services.ce.SequenceServiceCEImpl;
import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SequenceServiceImpl extends SequenceServiceCEImpl implements SequenceService {

    @Autowired
    public SequenceServiceImpl(EntityManager entityManager) {
        super(entityManager);
    }
}
