package com.appsmith.server.services;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.exports.internal.ExportApplicationService;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.imports.internal.ImportApplicationService;
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
            ImportApplicationService importApplicationService,
            ExportApplicationService exportApplicationService,
            ApplicationPermission applicationPermission,
            Gson gson,
            ResponseUtils responseUtils) {
        super(
                applicationSnapshotRepository,
                applicationService,
                importApplicationService,
                exportApplicationService,
                applicationPermission,
                gson,
                responseUtils);
    }
}
