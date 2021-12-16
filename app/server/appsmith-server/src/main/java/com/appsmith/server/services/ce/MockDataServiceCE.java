package com.appsmith.server.services.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.dtos.MockDataDTO;
import com.appsmith.server.dtos.MockDataSource;
import reactor.core.publisher.Mono;

public interface MockDataServiceCE {
    Mono<MockDataDTO> getMockDataSet();

    Mono<Datasource> createMockDataSet(MockDataSource mockDataSource);
}
