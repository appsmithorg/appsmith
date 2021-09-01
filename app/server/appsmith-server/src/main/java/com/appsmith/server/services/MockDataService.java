package com.appsmith.server.services;

import com.appsmith.server.domains.Datasource;
import com.appsmith.server.dtos.MockDataDTO;
import com.appsmith.server.dtos.MockDataSource;
import reactor.core.publisher.Mono;

public interface MockDataService {
    Mono<MockDataDTO> getMockDataSet();

    Mono<Datasource> createMockDataSet(MockDataSource mockDataSource);
}
