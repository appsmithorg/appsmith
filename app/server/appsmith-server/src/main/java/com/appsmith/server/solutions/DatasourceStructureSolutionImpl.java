package com.appsmith.server.solutions;

import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.services.AuthenticationValidator;
import com.appsmith.server.services.DatasourceConfigurationStructureService;
import com.appsmith.server.services.DatasourceContextService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.DatasourceStorageService;
import com.appsmith.server.services.PluginService;
import com.appsmith.server.solutions.ce.DatasourceStructureSolutionCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class DatasourceStructureSolutionImpl extends DatasourceStructureSolutionCEImpl implements DatasourceStructureSolution {
    public DatasourceStructureSolutionImpl(DatasourceService datasourceService,
                                           DatasourceStorageService datasourceStorageService,
                                           PluginExecutorHelper pluginExecutorHelper,
                                           PluginService pluginService,
                                           DatasourceContextService datasourceContextService,
                                           AuthenticationValidator authenticationValidator,
                                           DatasourcePermission datasourcePermission,
                                           DatasourceConfigurationStructureService datasourceConfigurationStructureService) {
        super(datasourceService, datasourceStorageService, pluginExecutorHelper, pluginService, datasourceContextService,
                authenticationValidator, datasourcePermission, datasourceConfigurationStructureService);
    }
}
