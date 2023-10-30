package com.appsmith.server.plugins.exports;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.QPlugin;
import com.appsmith.server.domains.WorkspacePlugin;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ExportingMetaDTO;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import com.appsmith.server.exports.exportable.ExportableServiceCE;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.services.WorkspaceService;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.stream.Collectors;

import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;

public class PluginExportableServiceCEImpl implements ExportableServiceCE<Plugin> {

    private final PluginService pluginService;
    private final WorkspaceService workspaceService;

    public PluginExportableServiceCEImpl(PluginService pluginService, WorkspaceService workspaceService) {
        this.pluginService = pluginService;
        this.workspaceService = workspaceService;
    }

    // Updates plugin map in exportable resources
    @Override
    public Mono<Void> getExportableEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            Mono<Application> applicationMono,
            ApplicationJson applicationJson) {
        return workspaceService
                .getById(applicationJson.getExportedApplication().getWorkspaceId())
                .map(workspace -> workspace.getPlugins().stream()
                        .map(WorkspacePlugin::getPluginId)
                        .collect(Collectors.toSet()))
                .flatMapMany(pluginIds -> pluginService.findAllByIdsWithoutPermission(
                        pluginIds,
                        List.of(fieldName(QPlugin.plugin.pluginName), fieldName(QPlugin.plugin.packageName))))
                .map(plugin -> {
                    mappedExportableResourcesDTO
                            .getPluginMap()
                            .put(
                                    plugin.getId(),
                                    plugin.getPluginName() == null ? plugin.getPackageName() : plugin.getPluginName());
                    return plugin;
                })
                .collectList()
                .then();
    }
}
