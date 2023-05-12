package com.appsmith.server.solutions.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.repositories.DatasourceStorageRepository;
import com.appsmith.server.services.DatasourceService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

@Slf4j
public class DatasourceStorageTransferSolutionCEImpl implements DatasourceStorageTransferSolutionCE {

    private final DatasourceService datasourceService;

    private final DatasourceStorageRepository datasourceStorageRepository;

    public DatasourceStorageTransferSolutionCEImpl(DatasourceService datasourceService,
                                                   DatasourceStorageRepository datasourceStorageRepository) {
        this.datasourceService = datasourceService;
        this.datasourceStorageRepository = datasourceStorageRepository;
    }


    @Override
    public DatasourceStorage initializeDatasourceStorage(Datasource datasource, String environmentId) {
        return new DatasourceStorage(datasource, FieldName.UNUSED_ENVIRONMENT_ID);
    }

    @Transactional
    @Override
    public Mono<DatasourceStorage> findByDatasourceIdAndEnvironmentIdWithPermission(String datasourceId,
                                                                                    String environmentId,
                                                                                    AclPermission permission) {
        return datasourceService
                .findById(datasourceId, permission)
                .flatMap(datasource1 -> {
                    DatasourceStorage datasourceStorage = this.initializeDatasourceStorage(datasource1, environmentId);
                    datasource1.setDatasourceConfiguration(null);
                    datasource1.setInvalids(null);
                    datasource1.setHasDatasourceConfigurationStorage(true);
                    return Mono.zip(datasourceStorageRepository.save(datasourceStorage), datasourceService.save(datasource1));
                })
                .map(Tuple2::getT1);
    }
}
