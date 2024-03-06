package com.appsmith.server.datasourcestorages.base;

import com.appsmith.external.models.AppsmithDomain;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.external.models.Environment;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.constants.AnalyticsConstants;
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
import com.appsmith.server.services.VariableReplacementService;
import com.appsmith.server.solutions.DatasourcePermission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
@Slf4j
public class DatasourceStorageServiceImpl extends DatasourceStorageServiceCECompatibleImpl
        implements DatasourceStorageService {
    private final VariableReplacementService variableReplacementService;
    private final EnvironmentService environmentService;

    public DatasourceStorageServiceImpl(
            DatasourceStorageRepository repository,
            DatasourcePermission datasourcePermission,
            PluginService pluginService,
            PluginExecutorHelper pluginExecutorHelper,
            AnalyticsService analyticsService,
            VariableReplacementService variableReplacementService,
            EnvironmentService environmentService,
            FeatureFlagService featureFlagService) {
        super(
                repository,
                datasourcePermission,
                pluginService,
                pluginExecutorHelper,
                analyticsService,
                environmentService,
                featureFlagService);
        this.variableReplacementService = variableReplacementService;
        this.environmentService = environmentService;
    }

    @Override
    public Mono<DatasourceStorage> findByDatasourceAndEnvironmentIdForExecution(
            Datasource datasource, String environmentId) {
        return super.findByDatasourceAndEnvironmentIdForExecution(datasource, environmentId)
                .flatMap(datasourceStorage -> {
                    Mono<AppsmithDomain> datasourceConfigurationMono =
                            this.variableReplacementService.replaceAll(datasourceStorage.getDatasourceConfiguration());
                    return datasourceConfigurationMono.flatMap(configuration -> {
                        datasourceStorage.setDatasourceConfiguration((DatasourceConfiguration) configuration);
                        return Mono.just(datasourceStorage);
                    });
                });
    }

    @Override
    protected Mono<DatasourceStorage> findByDatasourceIdAndEnvironmentId(String datasourceId, String environmentId) {
        return repository.findByDatasourceIdAndEnvironmentId(datasourceId, environmentId);
    }

    @Override
    public Mono<DatasourceStorage> checkEnvironment(DatasourceStorage datasourceStorage) {
        Mono<Environment> environmentMono = environmentService.findById(datasourceStorage.getEnvironmentId());
        return environmentMono
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.NO_RESOURCE_FOUND, FieldName.ENVIRONMENT, datasourceStorage.getEnvironmentId())))
                .map(environment -> datasourceStorage);
    }

    @Override
    public DatasourceStorageDTO getDatasourceStorageDTOFromDatasource(Datasource datasource, String environmentId) {
        if (datasource == null || datasource.getDatasourceStorages() == null) {
            return null;
        }
        return datasource.getDatasourceStorages().get(environmentId);
    }

    @Override
    public Mono<String> getEnvironmentNameFromEnvironmentIdForAnalytics(String environmentId) {
        return environmentService
                .findById(environmentId)
                .map(Environment::getName)
                .switchIfEmpty(Mono.just(AnalyticsConstants.ENVIRONMENT_NAME_DEFAULT));
    }

    @Override
    protected Mono<DatasourceStorage> errorMonoWhenDatasourceStorageNotFound(
            Datasource datasource, String environmentId) {

        Mono<Environment> environmentMono = environmentService
                .findById(environmentId)
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.NO_RESOURCE_FOUND, FieldName.DATASOURCE, datasource.getName())));

        return environmentMono.flatMap(environment -> Mono.error(new AppsmithException(
                AppsmithError.UNCONFIGURED_DATASOURCE_STORAGE, datasource.getName(), environment.getName())));
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_datasource_environments_enabled)
    public Flux<DatasourceStorage> findByDatasource(Datasource datasource) {
        return this.findByDatasourceId(datasource.getId()).map(datasourceStorage -> {
            datasourceStorage.prepareTransientFields(datasource);
            return datasourceStorage;
        });
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_custom_environments_enabled)
    public Mono<Long> getDatasourceStorageDTOsAllowed() {
        return Mono.just(Long.MAX_VALUE);
    }
}
