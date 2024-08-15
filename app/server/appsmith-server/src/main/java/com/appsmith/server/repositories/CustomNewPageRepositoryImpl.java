package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomNewPageRepositoryCEImpl;
import io.micrometer.observation.ObservationRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class CustomNewPageRepositoryImpl extends CustomNewPageRepositoryCEImpl implements CustomNewPageRepository {

    public CustomNewPageRepositoryImpl(ObservationRegistry observationRepository) {
        super(observationRepository);
    }
}
