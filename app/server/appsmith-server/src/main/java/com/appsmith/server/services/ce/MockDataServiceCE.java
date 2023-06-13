/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.services.ce;

import com.appsmith.external.models.DatasourceDTO;
import com.appsmith.server.dtos.MockDataDTO;
import com.appsmith.server.dtos.MockDataSource;
import reactor.core.publisher.Mono;

public interface MockDataServiceCE {
    Mono<MockDataDTO> getMockDataSet();

    Mono<DatasourceDTO> createMockDataSet(MockDataSource mockDataSource, String environmentId);
}
