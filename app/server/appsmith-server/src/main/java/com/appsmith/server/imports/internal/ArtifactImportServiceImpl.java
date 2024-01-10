package com.appsmith.server.imports.internal;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.applications.imports.ApplicationImportService;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.imports.importable.ArtifactImportService;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.WorkspaceService;
import org.springframework.stereotype.Component;
import org.springframework.transaction.reactive.TransactionalOperator;

@Component
public class ArtifactImportServiceImpl extends ArtifactImportServiceCEImpl implements ArtifactImportService {

    public ArtifactImportServiceImpl(
            ApplicationImportService applicationImportService,
            SessionUserService sessionUserService,
            WorkspaceService workspaceService,
            ImportableService<CustomJSLib> customJSLibImportableService,
            PermissionGroupRepository permissionGroupRepository,
            TransactionalOperator transactionalOperator,
            AnalyticsService analyticsService,
            ImportableService<Plugin> pluginImportableService,
            ImportableService<Datasource> datasourceImportableService,
            ImportableService<Theme> themeImportableService) {
        super(
                applicationImportService,
                sessionUserService,
                workspaceService,
                customJSLibImportableService,
                permissionGroupRepository,
                transactionalOperator,
                analyticsService,
                pluginImportableService,
                datasourceImportableService,
                themeImportableService);
    }
}
