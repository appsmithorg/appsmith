package com.appsmith.server.services;

import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.services.ce.MockDataServiceCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class MockDataServiceImpl extends MockDataServiceCEImpl implements MockDataService {

    public MockDataServiceImpl(CloudServicesConfig cloudServicesConfig,
                               DatasourceService datasourceService,
                               AnalyticsService analyticsService,
                               SessionUserService sessionUserService) {

        super(cloudServicesConfig, datasourceService, analyticsService, sessionUserService);
    }
}
