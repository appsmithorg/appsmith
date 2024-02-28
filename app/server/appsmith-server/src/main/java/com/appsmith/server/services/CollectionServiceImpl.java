package com.appsmith.server.services;

import com.appsmith.server.repositories.CollectionRepository;
import com.appsmith.server.services.ce.CollectionServiceCEImpl;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class CollectionServiceImpl extends CollectionServiceCEImpl implements CollectionService {

    public CollectionServiceImpl(
            Validator validator, CollectionRepository repository, AnalyticsService analyticsService) {
        super(validator, repository, analyticsService);
    }
}
