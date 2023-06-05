package com.appsmith.server.services;

import com.appsmith.external.models.AppsmithDomain;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.external.models.Environment;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.DatasourceStorageRepository;
import com.appsmith.server.services.ce.DatasourceStorageServiceCEImpl;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.DatasourceStorageTransferSolution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@Slf4j
public class DatasourceStorageServiceImpl extends DatasourceStorageServiceCEImpl implements DatasourceStorageService {
    private final VariableReplacementService variableReplacementService;
    private final EnvironmentService environmentService;



    public DatasourceStorageServiceImpl(DatasourceStorageRepository repository,
                                        DatasourceStorageTransferSolution datasourceStorageTransferSolution,
                                        DatasourcePermission datasourcePermission,
                                        PluginService pluginService,
                                        PluginExecutorHelper pluginExecutorHelper,
                                        AnalyticsService analyticsService,
                                        VariableReplacementService variableReplacementService,
                                        EnvironmentService environmentService) {
        super(repository, datasourceStorageTransferSolution, datasourcePermission, pluginService, pluginExecutorHelper,
                analyticsService);
        this.variableReplacementService = variableReplacementService;
        this.environmentService = environmentService;
    }

    @Override
    public Mono<DatasourceStorage> findByDatasourceAndEnvironmentIdForExecution(Datasource datasource, String environmentId) {
        return super.findByDatasourceAndEnvironmentIdForExecution(datasource, environmentId)
                .flatMap(datasourceStorage -> {
                    Mono<AppsmithDomain> datasourceConfigurationMono = this.variableReplacementService
                            .replaceAll(datasourceStorage.getDatasourceConfiguration());
                    return datasourceConfigurationMono
                            .flatMap(configuration -> {
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
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ENVIRONMENT,
                        datasourceStorage.getEnvironmentId())))
                .map(environment -> datasourceStorage);
    }

    @Override
    public DatasourceStorageDTO getDatasourceStorageDTOFromDatasource(Datasource datasource, String environmentId) {
        if (datasource == null || datasource.getDatasourceStorages() == null) {
            return null;
        }
        return datasource.getDatasourceStorages().get(environmentId);
    }
}
