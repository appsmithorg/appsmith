package com.appsmith.server.imports.internal;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.applications.imports.ApplicationImportService;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.imports.importable.ImportService;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.WorkspaceService;
import org.springframework.stereotype.Component;
import org.springframework.transaction.reactive.TransactionalOperator;

@Component
public class ImportServiceImpl extends ImportServiceCEImpl implements ImportService {

    public ImportServiceImpl(
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
