package com.appsmith.server.solutions.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.DatasourceStorageRepository;
import lombok.extern.slf4j.Slf4j;
import org.jetbrains.annotations.NotNull;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

@Slf4j
public class DatasourceStorageTransferSolutionCEImpl implements DatasourceStorageTransferSolutionCE {

    private final DatasourceRepository datasourceRepository;

    private final DatasourceStorageRepository datasourceStorageRepository;

    public DatasourceStorageTransferSolutionCEImpl(DatasourceRepository datasourceRepository,
                                                   DatasourceStorageRepository datasourceStorageRepository) {
        this.datasourceRepository = datasourceRepository;
        this.datasourceStorageRepository = datasourceStorageRepository;
    }


    @Override
    public DatasourceStorage initializeDatasourceStorage(Datasource datasource, String environmentId) {
        return new DatasourceStorage(datasource, FieldName.UNUSED_ENVIRONMENT_ID);
    }

    @Transactional
    @Override
    public Mono<DatasourceStorage> transferAndGetDatasourceStorage(String datasourceId,
                                                                   String environmentId,
                                                                   AclPermission permission) {
        return datasourceRepository
                .findById(datasourceId, permission)
                .flatMap(datasource -> transferDatasourceStorage(datasource, environmentId));

    }

    @Transactional
    @Override
    public Mono<DatasourceStorage> transferAndGetDatasourceStorage(Datasource datasource, String environmentId) {
        return this.transferDatasourceStorage(datasource, environmentId);
    }

    @NotNull
    private Mono<DatasourceStorage> transferDatasourceStorage(Datasource datasource, String environmentId) {
        DatasourceStorage datasourceStorage = this.initializeDatasourceStorage(datasource, environmentId);
        datasource.setDatasourceConfiguration(null);
        datasource.setInvalids(null);
        datasource.setHasDatasourceStorage(true);
        return Mono.zip(datasourceStorageRepository.save(datasourceStorage), datasourceRepository.save(datasource))
                .map(Tuple2::getT1);
    }

    @Transactional
    @Override
    public Mono<DatasourceStorage> transferToFallbackEnvironmentAndGetDatasourceStorage(Datasource datasource) {

        return getFallbackEnvironmentId(datasource.getWorkspaceId())
                .flatMap(environmentId -> transferDatasourceStorage(datasource, environmentId));
    }

    protected Mono<String> getFallbackEnvironmentId(String workspaceId) {
        return Mono.just(FieldName.UNUSED_ENVIRONMENT_ID);
    }

}
