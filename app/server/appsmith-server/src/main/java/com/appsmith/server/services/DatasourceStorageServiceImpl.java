package com.appsmith.server.services;

import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.DatasourceStorageRepository;
import com.appsmith.server.services.ce.DatasourceStorageServiceCEImpl;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.DatasourceStorageTransferSolution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class DatasourceStorageServiceImpl extends DatasourceStorageServiceCEImpl implements DatasourceStorageService {
    public DatasourceStorageServiceImpl(
            DatasourceStorageRepository repository,
            DatasourceStorageTransferSolution datasourceStorageTransferSolution,
            DatasourcePermission datasourcePermission,
            PluginService pluginService,
            PluginExecutorHelper pluginExecutorHelper,
            AnalyticsService analyticsService) {
        super(
                repository,
                datasourceStorageTransferSolution,
                datasourcePermission,
                pluginService,
                pluginExecutorHelper,
                analyticsService);
    }
}
