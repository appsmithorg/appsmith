package com.appsmith.server.services.ce;

import com.appsmith.server.domains.ApplicationSnapshot;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.repositories.ce.ApplicationSnapshotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

public class ApplicationSnapshotServiceCEImpl implements ApplicationSnapshotServiceCE {
    private final ApplicationSnapshotRepository applicationSnapshotRepository;

    @Autowired
    public ApplicationSnapshotServiceCEImpl(ApplicationSnapshotRepository applicationSnapshotRepository) {
        this.applicationSnapshotRepository = applicationSnapshotRepository;
    }

    @Override
    public Mono<ApplicationSnapshot> createSnapshotForApplication(String applicationId, ApplicationJson applicationJson) {
        return applicationSnapshotRepository.findByApplicationId(applicationId)
                .defaultIfEmpty(new ApplicationSnapshot())
                .flatMap(applicationSnapshot -> {
                    applicationSnapshot.setApplicationJson(applicationJson);
                    if(!StringUtils.hasLength(applicationSnapshot.getId())) { // it's a new object
                        applicationSnapshot.setApplicationId(applicationId);
                    }
                    return applicationSnapshotRepository.save(applicationSnapshot);
                });
    }
}
