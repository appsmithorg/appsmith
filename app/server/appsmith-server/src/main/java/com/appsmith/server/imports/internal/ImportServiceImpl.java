package com.appsmith.server.imports.internal;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.imports.internal.artifactbased.ArtifactBasedImportService;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.WorkspaceService;
import org.springframework.stereotype.Component;
import org.springframework.transaction.reactive.TransactionalOperator;

@Component
public class ImportServiceImpl extends ImportServiceCEImpl implements ImportService {

    public ImportServiceImpl(
            ArtifactBasedImportService<Application, ApplicationImportDTO, ApplicationJson> applicationImportService,
            SessionUserService sessionUserService,
            WorkspaceService workspaceService,
            PermissionGroupRepository permissionGroupRepository,
            TransactionalOperator transactionalOperator,
            AnalyticsService analyticsService,
            ImportableService<Plugin> pluginImportableService,
            ImportableService<Datasource> datasourceImportableService) {
        super(
                applicationImportService,
                sessionUserService,
                workspaceService,
                permissionGroupRepository,
                transactionalOperator,
                analyticsService,
                pluginImportableService,
                datasourceImportableService);
    }
}
