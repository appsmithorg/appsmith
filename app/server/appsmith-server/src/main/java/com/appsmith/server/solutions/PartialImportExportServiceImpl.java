package com.appsmith.server.solutions;

import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.services.ActionCollectionService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.CustomJSLibService;
import com.appsmith.server.solutions.ce.PartialImportExportServiceCEImpl;
import com.google.gson.Gson;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class PartialImportExportServiceImpl extends PartialImportExportServiceCEImpl
        implements PartialImportExportService {

    public PartialImportExportServiceImpl(
            ImportExportApplicationService importExportApplicationService,
            Gson gson,
            ApplicationService applicationService,
            CustomJSLibService customJSLibService,
            PermissionGroupRepository permissionGroupRepository,
            WorkspacePermission workspacePermission,
            ApplicationPermission applicationPermission,
            PagePermission pagePermission,
            ActionPermission actionPermission,
            DatasourcePermission datasourcePermission,
            ActionCollectionService actionCollectionService,
            ActionCollectionRepository actionCollectionRepository) {
        super(
                importExportApplicationService,
                gson,
                applicationService,
                customJSLibService,
                permissionGroupRepository,
                workspacePermission,
                applicationPermission,
                pagePermission,
                actionPermission,
                datasourcePermission,
                actionCollectionService,
                actionCollectionRepository);
    }
}
