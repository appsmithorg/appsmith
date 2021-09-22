package com.appsmith.server.services;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.dtos.MockDataDTO;
import com.appsmith.server.dtos.MockDataSource;
import reactor.core.publisher.Mono;

public interface MockDataService {
    Mono<MockDataDTO> getMockDataSet();

    Mono<Datasource> createMockDataSet(MockDataSource mockDataSource);
}
