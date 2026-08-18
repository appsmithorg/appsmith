package com.appsmith.server.services;

import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.services.ce.AIAssistantServiceCEImpl;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.DatasourceStructureSolution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class AIAssistantServiceImpl extends AIAssistantServiceCEImpl implements AIAssistantService {

    public AIAssistantServiceImpl(
            OrganizationService organizationService,
            AIReferenceService aiReferenceService,
            NewActionService newActionService,
            DatasourceStructureSolution datasourceStructureSolution,
            PluginService pluginService,
            ActionPermission actionPermission) {
        super(
                organizationService,
                aiReferenceService,
                newActionService,
                datasourceStructureSolution,
                pluginService,
                actionPermission);
    }
}
