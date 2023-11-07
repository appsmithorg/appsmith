package com.appsmith.server.datasourcestorages.base;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.Environment;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.DatasourceStorageRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.EnvironmentService;
import com.appsmith.server.solutions.DatasourcePermission;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
public class DatasourceStorageServiceCECompatibleImpl extends DatasourceStorageServiceCEImpl
        implements DatasourceStorageServiceCECompatible {

    private final EnvironmentService environmentService;

    public DatasourceStorageServiceCECompatibleImpl(
            DatasourceStorageRepository repository,
            DatasourcePermission datasourcePermission,
            PluginService pluginService,
            PluginExecutorHelper pluginExecutorHelper,
            AnalyticsService analyticsService,
            EnvironmentService environmentService) {
        super(repository, datasourcePermission, pluginService, pluginExecutorHelper, analyticsService);
        this.environmentService = environmentService;
    }

    @Override
    public Flux<DatasourceStorage> findByDatasource(Datasource datasource) {

        if (!StringUtils.hasText(datasource.getWorkspaceId())) {
            return Flux.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }

        Mono<String> defaultEnvironmentIdMono = environmentService
                .getDefaultEnvironment(datasource.getWorkspaceId())
                .next()
                .map(Environment::getId);

        return defaultEnvironmentIdMono
                .flatMap(defaultEnvironmentId -> findStrictlyByDatasourceIdAndEnvironmentId(
                                datasource.getId(), defaultEnvironmentId)
                        .map(datasourceStorage -> {
                            datasourceStorage.prepareTransientFields(datasource);
                            return datasourceStorage;
                        }))
                .flux();
    }

    @Override
    public Mono<Long> getDatasourceStorageDTOsAllowed() {
        return Mono.just(1L);
    }
}
