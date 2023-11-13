package com.appsmith.server.datasourcestorages.base;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.Environment;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.DatasourceStorageRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.EnvironmentService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.solutions.DatasourcePermission;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
public class DatasourceStorageServiceCECompatibleImpl extends DatasourceStorageServiceCEImpl
        implements DatasourceStorageServiceCECompatible {

    private final EnvironmentService environmentService;
    private final FeatureFlagService featureFlagService;

    public DatasourceStorageServiceCECompatibleImpl(
            DatasourceStorageRepository repository,
            DatasourcePermission datasourcePermission,
            PluginService pluginService,
            PluginExecutorHelper pluginExecutorHelper,
            AnalyticsService analyticsService,
            EnvironmentService environmentService,
            FeatureFlagService featureFlagService) {
        super(repository, datasourcePermission, pluginService, pluginExecutorHelper, analyticsService);
        this.environmentService = environmentService;
        this.featureFlagService = featureFlagService;
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

    /**
     * Since it's a fallback method from custom-environments, this method ensures that a maximum of two storages are
     * allowed if the multiple-environments flag (release_datasource_environments_enabled) is switched on.
     * Otherwise, this should return only 1 storage.
     * Each datasourceStorage for a datasource is mapped to one environment,
     * hence number of allowed datasource storages to be created at once depends on this number.
     * This is a temporary check, Ideally this method will also be annotated with feature flag and fallback
     * implementation should lie in DatasourceStorageServiceCEImpl (where no flags are present)
     * @return Long value of allowed datasource storages
     */
    @Override
    public Mono<Long> getDatasourceStorageDTOsAllowed() {
        return featureFlagService
                .check(FeatureFlagEnum.release_datasource_environments_enabled)
                .map(isFeatureFlagEnabled -> {
                    if (isFeatureFlagEnabled) {
                        return 2L;
                    }
                    return 1L;
                });
    }
}
