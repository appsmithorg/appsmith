package com.appsmith.server.services;

import com.appsmith.server.repositories.ApplicationSnapshotRepository;
import com.appsmith.server.services.ce.ApplicationSnapshotServiceCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class ApplicationSnapshotServiceImpl extends ApplicationSnapshotServiceCEImpl implements ApplicationSnapshotService {
    public ApplicationSnapshotServiceImpl(ApplicationSnapshotRepository applicationSnapshotRepository) {
        super(applicationSnapshotRepository);
    }
}
