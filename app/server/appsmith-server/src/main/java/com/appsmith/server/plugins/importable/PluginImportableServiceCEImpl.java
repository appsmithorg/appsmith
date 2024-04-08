package com.appsmith.server.plugins.importable;

import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.domains.WorkspacePlugin;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.imports.importable.ImportableServiceCE;
import com.appsmith.server.imports.importable.artifactbased.ArtifactBasedImportableService;
import com.appsmith.server.plugins.base.PluginService;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
public class PluginImportableServiceCEImpl implements ImportableServiceCE<Plugin> {
    private final PluginService pluginService;

    public PluginImportableServiceCEImpl(PluginService pluginService) {
        this.pluginService = pluginService;
    }

    @Override
    public ArtifactBasedImportableService<Plugin, ?> getArtifactBasedImportableService(
            ImportingMetaDTO importingMetaDTO) {
        // this resource is not artifact dependent
        return null;
    }

    // Updates plugin map in importable resources
    @Override
    public Mono<Void> importEntities(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<? extends Artifact> importableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson) {
        return workspaceMono
                .map(workspace -> workspace.getPlugins().stream()
                        .map(WorkspacePlugin::getPluginId)
                        .collect(Collectors.toSet()))
                .flatMapMany(pluginIds -> pluginService.findAllByIdsWithoutPermission(
                        pluginIds, List.of(Plugin.Fields.pluginName, Plugin.Fields.packageName)))
                .map(plugin -> {
                    mappedImportableResourcesDTO
                            .getPluginMap()
                            .put(
                                    plugin.getPluginName() == null ? plugin.getPackageName() : plugin.getPluginName(),
                                    plugin.getId());
                    return plugin;
                })
                .collectList()
                .elapsed()
                .doOnNext(tuples -> log.debug("time to get plugin map: {}", tuples.getT1()))
                .then();
    }

    @Override
    public Mono<Void> importEntities(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<? extends Artifact> importableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson,
            boolean isContextAgnostic) {
        return importEntities(
                importingMetaDTO,
                mappedImportableResourcesDTO,
                workspaceMono,
                importableArtifactMono,
                artifactExchangeJson);
    }
}
