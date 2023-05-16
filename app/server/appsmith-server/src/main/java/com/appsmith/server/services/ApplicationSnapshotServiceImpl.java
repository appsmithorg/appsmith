package com.appsmith.server.services;

import com.appsmith.server.repositories.ApplicationSnapshotRepository;
import com.appsmith.server.services.ce.ApplicationSnapshotServiceCEImpl;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.ImportExportApplicationService;
import com.google.gson.Gson;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class ApplicationSnapshotServiceImpl extends ApplicationSnapshotServiceCEImpl implements ApplicationSnapshotService {

    public ApplicationSnapshotServiceImpl(ApplicationSnapshotRepository applicationSnapshotRepository, ApplicationService applicationService, ImportExportApplicationService importExportApplicationService, ApplicationPermission applicationPermission, Gson gson) {
        super(applicationSnapshotRepository, applicationService, importExportApplicationService, applicationPermission, gson);
    }
}
