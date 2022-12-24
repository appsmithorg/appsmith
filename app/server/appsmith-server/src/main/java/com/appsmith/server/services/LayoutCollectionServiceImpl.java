package com.appsmith.server.services;

import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.services.ce.LayoutCollectionServiceCEImpl;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.solutions.RefactoringSolution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class LayoutCollectionServiceImpl extends LayoutCollectionServiceCEImpl implements LayoutCollectionService {

    public LayoutCollectionServiceImpl(NewPageService newPageService,
                                       LayoutActionService layoutActionService,
                                       RefactoringSolution refactoringSolution,
                                       ActionCollectionService actionCollectionService,
                                       NewActionService newActionService,
                                       AnalyticsService analyticsService,
                                       ResponseUtils responseUtils,
                                       ActionCollectionRepository actionCollectionRepository,
                                       PagePermission pagePermission,
                                       ActionPermission actionPermission) {

        super(newPageService, layoutActionService, refactoringSolution, actionCollectionService, newActionService, analyticsService,
                responseUtils, actionCollectionRepository, pagePermission, actionPermission);
    }
}
