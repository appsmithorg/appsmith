package com.appsmith.server.exports.internal;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.SerialiseApplicationObjective;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ExportingMetaDTO;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import com.appsmith.server.exports.exportable.ExportableService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.google.gson.Gson;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;

@Slf4j
@Service
public class ExportApplicationServiceImpl extends ExportApplicationServiceCEImpl implements ExportApplicationService {

    private final ExportableService<ModuleInstance> moduleInstanceExportableService;

    public ExportApplicationServiceImpl(
            SessionUserService sessionUserService,
            WorkspaceService workspaceService,
            ApplicationService applicationService,
            AnalyticsService analyticsService,
            ApplicationPermission applicationPermission,
            Gson gson,
            ExportableService<Datasource> datasourceExportableService,
            ExportableService<Plugin> pluginExportableService,
            ExportableService<NewPage> newPageExportableService,
            ExportableService<NewAction> newActionExportableService,
            ExportableService<ActionCollection> actionCollectionExportableService,
            ExportableService<Theme> themeExportableService,
            ExportableService<CustomJSLib> customJSLibExportableService,
            ExportableService<ModuleInstance> moduleInstanceExportableService) {
        super(
                sessionUserService,
                workspaceService,
                applicationService,
                analyticsService,
                applicationPermission,
                gson,
                datasourceExportableService,
                pluginExportableService,
                newPageExportableService,
                newActionExportableService,
                actionCollectionExportableService,
                themeExportableService,
                customJSLibExportableService);
        this.moduleInstanceExportableService = moduleInstanceExportableService;
    }

    @Override
    protected Mono<Void> sanitizeEntities(
            SerialiseApplicationObjective serialiseFor,
            ApplicationJson applicationJson,
            MappedExportableResourcesDTO mappedResourcesDTO,
            ExportingMetaDTO exportingMetaDTO) {
        return super.sanitizeEntities(serialiseFor, applicationJson, mappedResourcesDTO, exportingMetaDTO)
                .then(Mono.defer(() -> {
                    newActionExportableService.sanitizeEntities(
                            exportingMetaDTO, mappedResourcesDTO, applicationJson, serialiseFor);

                    return Mono.empty().then();
                }));
    }

    @Override
    protected List<Mono<Void>> getPageDependentExportables(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedResourcesDTO,
            Mono<Application> applicationMono,
            ApplicationJson applicationJson) {
        List<Mono<Void>> pageDependentExportables = super.getPageDependentExportables(
                exportingMetaDTO, mappedResourcesDTO, applicationMono, applicationJson);

        // Requires pageIdToNameMap
        // Updates moduleInstanceId to name map in exportable resources.
        // Also directly updates required module instance information in application json
        Mono<Void> moduleInstanceExportablesMono = moduleInstanceExportableService.getExportableEntities(
                exportingMetaDTO, mappedResourcesDTO, applicationMono, applicationJson);

        pageDependentExportables.add(moduleInstanceExportablesMono);

        return pageDependentExportables;
    }
}
