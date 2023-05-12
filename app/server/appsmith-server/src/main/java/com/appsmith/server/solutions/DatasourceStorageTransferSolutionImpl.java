package com.appsmith.server.solutions;

import com.appsmith.server.repositories.DatasourceStorageRepository;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.solutions.ce.DatasourceStorageTransferSolutionCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;


@Service
@Slf4j
public class DatasourceStorageTransferSolutionImpl extends DatasourceStorageTransferSolutionCEImpl
        implements DatasourceStorageTransferSolution {
    public DatasourceStorageTransferSolutionImpl(DatasourceService datasourceService,
                                                 DatasourceStorageRepository datasourceStorageRepository) {
        super(datasourceService, datasourceStorageRepository);
    }
}
