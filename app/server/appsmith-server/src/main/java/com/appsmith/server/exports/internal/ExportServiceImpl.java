package com.appsmith.server.exports.internal;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.Package;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.PackageJson;
import com.appsmith.server.exports.exportable.ExportableService;
import com.appsmith.server.exports.internal.artifactbased.ArtifactBasedExportService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.WorkspaceService;
import com.google.gson.Gson;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class ExportServiceImpl extends ExportServiceCEImpl implements ExportService {
    private final ArtifactBasedExportService<Package, PackageJson> packageExportService;

    public ExportServiceImpl(
            SessionUserService sessionUserService,
            AnalyticsService analyticsService,
            ArtifactBasedExportService<Application, ApplicationJson> applicationExportService,
            ArtifactBasedExportService<Package, PackageJson> packageExportService,
            WorkspaceService workspaceService,
            Gson gson,
            ExportableService<Datasource> datasourceExportableService,
            ExportableService<Plugin> pluginExportableService,
            ExportableService<CustomJSLib> customJSLibExportableService) {
        super(
                sessionUserService,
                analyticsService,
                applicationExportService,
                workspaceService,
                gson,
                datasourceExportableService,
                pluginExportableService,
                customJSLibExportableService);
        this.packageExportService = packageExportService;
    }

    @Override
    public ArtifactBasedExportService<?, ?> getContextBasedExportService(@NonNull ArtifactType artifactType) {
        return switch (artifactType) {
            case PACKAGE -> this.packageExportService;
            default -> super.getContextBasedExportService(artifactType);
        };
    }
}
