package com.appsmith.server.solutions;

import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.services.*;
import com.appsmith.server.solutions.ce.DatasourceStructureSolutionCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class DatasourceStructureSolutionImpl extends DatasourceStructureSolutionCEImpl implements DatasourceStructureSolution {

    public DatasourceStructureSolutionImpl(DatasourceService datasourceService,
                                           PluginExecutorHelper pluginExecutorHelper,
                                           PluginService pluginService,
                                           DatasourceContextService datasourceContextService,
                                           AuthenticationValidator authenticationValidator,
                                           DatasourcePermission datasourcePermission,
                                           DatasourceConfigurationStructureService datasourceConfigurationStructureService,
                                           AnalyticsService analyticsService) {

        super(datasourceService, pluginExecutorHelper, pluginService, datasourceContextService,
                authenticationValidator, datasourcePermission, datasourceConfigurationStructureService,analyticsService);
    }
}
