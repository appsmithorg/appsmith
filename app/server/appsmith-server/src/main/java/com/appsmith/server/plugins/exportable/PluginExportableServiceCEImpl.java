package com.appsmith.server.plugins.exportable;

import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.WorkspacePlugin;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ExportingMetaDTO;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import com.appsmith.server.exports.exportable.ExportableServiceCE;
import com.appsmith.server.exports.exportable.artifactbased.ArtifactBasedExportableService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.services.WorkspaceService;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.stream.Collectors;

public class PluginExportableServiceCEImpl implements ExportableServiceCE<Plugin> {

    private final PluginService pluginService;
    private final WorkspaceService workspaceService;

    public PluginExportableServiceCEImpl(PluginService pluginService, WorkspaceService workspaceService) {
        this.pluginService = pluginService;
        this.workspaceService = workspaceService;
    }

    @Override
    public ArtifactBasedExportableService<Plugin, ?> getArtifactBasedExportableService(
            ExportingMetaDTO exportingMetaDTO) {
        // This resource is not artifact dependent
        return null;
    }

    // Updates plugin map in exportable resources
    @Override
    public Mono<Void> getExportableEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            Mono<? extends Artifact> exportableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson) {

        return workspaceService
                .getById(artifactExchangeJson.getArtifact().getWorkspaceId())
                .map(workspace -> workspace.getPlugins().stream()
                        .map(WorkspacePlugin::getPluginId)
                        .collect(Collectors.toSet()))
                .flatMapMany(pluginIds -> pluginService.findAllByIdsWithoutPermission(
                        pluginIds, List.of(Plugin.Fields.pluginName, Plugin.Fields.packageName)))
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

    @Override
    public Mono<Void> getExportableEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            Mono<? extends Artifact> exportableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson,
            Boolean isContextAgnostic) {
        return exportableArtifactMono.flatMap(exportableArtifact -> {
            return getExportableEntities(
                    exportingMetaDTO, mappedExportableResourcesDTO, exportableArtifactMono, artifactExchangeJson);
        });
    }
}
