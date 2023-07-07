package com.appsmith.server.solutions.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.DatasourceStorageRepository;
import com.appsmith.server.services.WorkspaceService;
import lombok.extern.slf4j.Slf4j;
import org.jetbrains.annotations.NotNull;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

@Slf4j
public class DatasourceStorageTransferSolutionCEImpl implements DatasourceStorageTransferSolutionCE {

    private final DatasourceRepository datasourceRepository;

    private final DatasourceStorageRepository datasourceStorageRepository;
    private final WorkspaceService workspaceService;

    public DatasourceStorageTransferSolutionCEImpl(
            DatasourceRepository datasourceRepository,
            DatasourceStorageRepository datasourceStorageRepository,
            WorkspaceService workspaceService) {
        this.datasourceRepository = datasourceRepository;
        this.datasourceStorageRepository = datasourceStorageRepository;
        this.workspaceService = workspaceService;
    }

    @Override
    public DatasourceStorage initializeDatasourceStorage(Datasource datasource, String environmentId) {
        return new DatasourceStorage(datasource, FieldName.UNUSED_ENVIRONMENT_ID);
    }

    @Transactional
    @Override
    public Mono<DatasourceStorage> transferAndGetDatasourceStorage(Datasource datasource, String environmentId) {
        return this.transferDatasourceStorage(datasource, environmentId);
    }

    @NotNull private Mono<DatasourceStorage> transferDatasourceStorage(Datasource datasource, String environmentId) {
        final DatasourceStorage datasourceStorage = this.initializeDatasourceStorage(datasource, environmentId);
        datasource.setDatasourceConfiguration(null);
        datasource.setInvalids(null);
        datasource.setHasDatasourceStorage(true);
        return datasourceStorageRepository
                .save(datasourceStorage)
                .zipWhen(datasourceStorage1 -> datasourceRepository.save(datasource))
                .map(Tuple2::getT1);
    }

    @Transactional
    @Override
    public Mono<DatasourceStorage> transferToFallbackEnvironmentAndGetDatasourceStorage(Datasource datasource) {

        return workspaceService
                .getDefaultEnvironmentId(datasource.getWorkspaceId())
                .flatMap(environmentId -> transferDatasourceStorage(datasource, environmentId));
    }
}
