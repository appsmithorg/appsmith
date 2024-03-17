package com.appsmith.server.solutions;

import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.datasourcestorages.base.DatasourceStorageService;
import com.appsmith.server.helpers.InstanceConfigHelper;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.helpers.RedirectHelper;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.solutions.ce.AuthenticationServiceCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class AuthenticationServiceImpl extends AuthenticationServiceCEImpl implements AuthenticationService {
    public AuthenticationServiceImpl(
            DatasourceService datasourceService,
            PluginService pluginService,
            RedirectHelper redirectHelper,
            NewPageService newPageService,
            CloudServicesConfig cloudServicesConfig,
            ConfigService configService,
            DatasourcePermission datasourcePermission,
            PagePermission pagePermission,
            PluginExecutorHelper pluginExecutorHelper,
            DatasourceStorageService datasourceStorageService,
            InstanceConfigHelper instanceConfigHelper) {
        super(
                datasourceService,
                pluginService,
                redirectHelper,
                newPageService,
                cloudServicesConfig,
                configService,
                datasourcePermission,
                pagePermission,
                pluginExecutorHelper,
                datasourceStorageService,
                instanceConfigHelper);
    }
}
