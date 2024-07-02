package com.appsmith.server.imports.internal;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.converters.ArtifactExchangeJsonAdapter;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.imports.internal.artifactbased.ArtifactBasedImportService;
import com.appsmith.server.migrations.JsonSchemaMigration;
import com.appsmith.server.repositories.cakes.PermissionGroupRepositoryCake;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.WorkspaceService;
import com.google.gson.GsonBuilder;
import org.springframework.stereotype.Service;

@Service
public class ImportServiceImpl extends ImportServiceCEImpl implements ImportService {
    public ImportServiceImpl(
            ArtifactBasedImportService<Application, ApplicationImportDTO, ApplicationJson> applicationImportService,
            SessionUserService sessionUserService,
            WorkspaceService workspaceService,
            PermissionGroupRepositoryCake permissionGroupRepository,
            AnalyticsService analyticsService,
            ImportableService<Plugin> pluginImportableService,
            ImportableService<Datasource> datasourceImportableService,
            GsonBuilder gsonBuilder,
            ArtifactExchangeJsonAdapter artifactExchangeJsonAdapter,
            JsonSchemaMigration jsonSchemaMigration) {
        super(
                applicationImportService,
                sessionUserService,
                workspaceService,
                permissionGroupRepository,
                analyticsService,
                pluginImportableService,
                datasourceImportableService,
                gsonBuilder,
                artifactExchangeJsonAdapter,
                jsonSchemaMigration);
    }
}
