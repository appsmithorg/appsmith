package com.appsmith.server.services.ce;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.DatasourceStorageRepository;
import com.appsmith.server.services.PluginService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.DatasourceStorageTransferSolution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
public class DatasourceStorageServiceCEImpl implements DatasourceStorageServiceCE {

    private final DatasourceStorageRepository repository;
    private final DatasourceStorageTransferSolution datasourceStorageTransferSolution;
    private final DatasourcePermission datasourcePermission;
    private final WorkspaceService workspaceService;
    private final PluginService pluginService;
    private final PluginExecutorHelper pluginExecutorHelper;

    public DatasourceStorageServiceCEImpl(DatasourceStorageRepository repository,
                                          DatasourceStorageTransferSolution datasourceStorageTransferSolution,
                                          DatasourcePermission datasourcePermission,
                                          WorkspaceService workspaceService,
                                          PluginService pluginService,
                                          PluginExecutorHelper pluginExecutorHelper) {
        this.repository = repository;
        this.datasourceStorageTransferSolution = datasourceStorageTransferSolution;
        this.datasourcePermission = datasourcePermission;
        this.workspaceService = workspaceService;
        this.pluginService = pluginService;
        this.pluginExecutorHelper = pluginExecutorHelper;
    }

    @Override
    public Flux<DatasourceStorage> findByDatasourceId(String datasourceId) {
        return repository.findByDatasourceId(datasourceId);
    }

    @Override
    public Flux<DatasourceStorage> findAllByDatasourceIds(List<String> datasourceIds) {
        return repository.findAllByDatasourceIds(datasourceIds);
    }

    @Override
    public Mono<DatasourceStorage> findOneByDatasourceId(String datasourceId) {
        return repository.findOneByDatasourceId(datasourceId);
    }

    @Override
    public Mono<DatasourceStorage> save(DatasourceStorage datasourceStorage) {
        return repository.save(datasourceStorage);
    }

    @Override
    public Mono<DatasourceStorage> archive(DatasourceStorage datasourceStorage) {
        return repository.archive(datasourceStorage);
    }


    @Override
    public Mono<DatasourceStorage> getDatasourceStorageForExecution(ActionDTO actionDTO, String environmentId) {
        Datasource datasource = actionDTO.getDatasource();
        if (datasource != null && datasource.getId() != null) {
            // This is an action with a global datasource,
            // we need to find the entry from db and populate storage
            return this.findByDatasourceIdAndEnvironmentIdWithPermission(datasource.getId(), environmentId, );
        }

        if (datasource == null) {
            return Mono.empty();
        } else {
            // For embedded datasources, we are simply relying on datasource configuration property
            return Mono.justOrEmpty(datasource.getDatasourceStorage())
                    .switchIfEmpty(Mono.just(datasourceStorageTransferSolution.initializeDatasourceStorage(datasource, environmentId)));
        }
    }

    @Override
    public Mono<DatasourceStorage> findByDatasourceIdAndEnvironmentIdWithPermission(String datasourceId,
                                                                                    String environmentId,
                                                                                    AclPermission aclPermission) {
        return this.findByDatasourceIdAndEnvironmentId(datasourceId, environmentId)
                // TODO: This is a temporary call being made till storage transfer migrations are done
                .switchIfEmpty(datasourceStorageTransferSolution
                        .findByDatasourceIdAndEnvironmentIdWithPermission(
                                datasourceId,
                                environmentId,
                                aclPermission))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND,
                        FieldName.DATASOURCE, datasourceId)));
    }

    @Override
    public Mono<DatasourceStorage> findByDatasourceIdAndEnvironmentId(String datasourceId, String environmentId) {
        return repository.findByDatasourceIdAndEnvironmentId(datasourceId, environmentId);
    }

    @Override
    public Mono<DatasourceStorage> validateDatasourceStorage(DatasourceStorage datasourceStorage) {
        Set<String> invalids = new HashSet<>();
        datasourceStorage.setInvalids(invalids);

        if (!StringUtils.hasText(datasourceStorage.getName())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.NAME));
        }

        if (datasourceStorage.getPluginId() == null) {
            invalids.add(AppsmithError.PLUGIN_ID_NOT_GIVEN.getMessage());
            return Mono.just(datasourceStorage);
        }

        if (datasourceStorage.getWorkspaceId() == null) {
            invalids.add(AppsmithError.WORKSPACE_ID_NOT_GIVEN.getMessage());
            return Mono.just(datasourceStorage);
        }

        Mono<Workspace> checkPluginInstallationAndThenReturnWorkspaceMono = workspaceService
                .findByIdAndPluginsPluginId(datasourceStorage.getWorkspaceId(), datasourceStorage.getPluginId())
                .switchIfEmpty(Mono.defer(() -> {
                    invalids.add(AppsmithError.PLUGIN_NOT_INSTALLED.getMessage(datasourceStorage.getPluginId()));
                    return Mono.just(new Workspace());
                }));

        if (datasourceStorage.getDatasourceConfiguration() == null) {
            invalids.add(AppsmithError.NO_CONFIGURATION_FOUND_IN_DATASOURCE.getMessage());
        }

        final Mono<Plugin> pluginMono = pluginService.findById(datasourceStorage.getPluginId()).cache();
        Mono<PluginExecutor> pluginExecutorMono = pluginExecutorHelper.getPluginExecutor(pluginMono)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PLUGIN, datasourceStorage.getPluginId())));

        return checkPluginInstallationAndThenReturnWorkspaceMono
                .then(pluginExecutorMono)
                .flatMap(pluginExecutor -> {
                    DatasourceConfiguration datasourceConfiguration = datasourceStorage.getDatasourceConfiguration();
                    if (datasourceConfiguration != null && !pluginExecutor.isDatasourceValid(datasourceConfiguration)) {
                        invalids.addAll(pluginExecutor.validateDatasource(datasourceConfiguration));
                    }

                    return pluginMono.map(plugin -> {
                        // setting the plugin name to datasource.
                        // this is required in analytics events for datasource e.g. create ds, update ds
                        datasourceStorage.setPluginName(plugin.getName());
                        return datasourceStorage;
                    });
                });
    }

}
