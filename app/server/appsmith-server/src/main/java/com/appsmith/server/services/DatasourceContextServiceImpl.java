package com.appsmith.server.services;

import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.datasourcestorages.base.DatasourceStorageService;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.services.ce.DatasourceContextServiceCEImpl;
import com.appsmith.server.solutions.DatasourcePermission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class DatasourceContextServiceImpl extends DatasourceContextServiceCEImpl implements DatasourceContextService {

    public DatasourceContextServiceImpl(
            @Lazy DatasourceService datasourceService,
            DatasourceStorageService datasourceStorageService,
            PluginService pluginService,
            PluginExecutorHelper pluginExecutorHelper,
            ConfigService configService,
            DatasourcePermission datasourcePermission,
            FeatureFlagService featureFlagService) {

        super(
                datasourceService,
                datasourceStorageService,
                pluginService,
                pluginExecutorHelper,
                configService,
                datasourcePermission,
                featureFlagService);
    }
}
