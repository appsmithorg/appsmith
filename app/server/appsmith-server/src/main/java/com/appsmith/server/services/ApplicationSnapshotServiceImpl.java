package com.appsmith.server.services;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.exports.internal.ExportService;
import com.appsmith.server.imports.internal.ImportService;
import com.appsmith.server.repositories.ApplicationSnapshotRepository;
import com.appsmith.server.services.ce.ApplicationSnapshotServiceCEImpl;
import com.appsmith.server.solutions.ApplicationPermission;
import com.google.gson.Gson;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class ApplicationSnapshotServiceImpl extends ApplicationSnapshotServiceCEImpl
        implements ApplicationSnapshotService {
    public ApplicationSnapshotServiceImpl(
            ApplicationSnapshotRepository applicationSnapshotRepository,
            ApplicationService applicationService,
            ImportService importService,
            ExportService exportService,
            ApplicationPermission applicationPermission,
            Gson gson) {
        super(
                applicationSnapshotRepository,
                applicationService,
                importService,
                exportService,
                applicationPermission,
                gson);
    }
}
