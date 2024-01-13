package com.appsmith.server.plugins.imports;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.QPlugin;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.domains.WorkspacePlugin;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.imports.importable.ImportableServiceCE;
import com.appsmith.server.plugins.base.PluginService;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.stream.Collectors;

import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;

@Slf4j
public class PluginImportableServiceCEImpl implements ImportableServiceCE<Plugin> {
    private final PluginService pluginService;

    public PluginImportableServiceCEImpl(PluginService pluginService) {
        this.pluginService = pluginService;
    }

    // Updates plugin map in importable resources
    @Override
    public Mono<Void> importEntities(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<Application> applicationMono,
            ApplicationJson applicationJson,
            boolean isPartialImport) {
        return workspaceMono
                .map(workspace -> workspace.getPlugins().stream()
                        .map(WorkspacePlugin::getPluginId)
                        .collect(Collectors.toSet()))
                .flatMapMany(pluginIds -> pluginService.findAllByIdsWithoutPermission(
                        pluginIds,
                        List.of(fieldName(QPlugin.plugin.pluginName), fieldName(QPlugin.plugin.packageName))))
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
}
