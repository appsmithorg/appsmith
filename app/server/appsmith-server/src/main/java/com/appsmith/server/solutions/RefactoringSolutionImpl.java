package com.appsmith.server.solutions;

import com.appsmith.server.configurations.InstanceConfig;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.services.ActionCollectionService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.AstService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.solutions.ce.RefactoringSolutionCEImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class RefactoringSolutionImpl extends RefactoringSolutionCEImpl implements RefactoringSolution {

    public RefactoringSolutionImpl(ObjectMapper objectMapper,
                                   NewPageService newPageService,
                                   NewActionService newActionService,
                                   ActionCollectionService actionCollectionService,
                                   ResponseUtils responseUtils,
                                   LayoutActionService layoutActionService,
                                   ApplicationService applicationService,
                                   AstService astService,
                                   InstanceConfig instanceConfig) {
        super(objectMapper,
                newPageService,
                newActionService,
                actionCollectionService,
                responseUtils,
                layoutActionService,
                applicationService,
                astService,
                instanceConfig);
    }
}
