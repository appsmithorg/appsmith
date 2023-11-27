package com.appsmith.server.services;

import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.refactors.applications.RefactoringSolution;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.services.ce.LayoutCollectionServiceCEImpl;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.PagePermission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class LayoutCollectionServiceImpl extends LayoutCollectionServiceCEImpl implements LayoutCollectionService {

    public LayoutCollectionServiceImpl(
            NewPageService newPageService,
            LayoutActionService layoutActionService,
            UpdateLayoutService updateLayoutService,
            RefactoringSolution refactoringSolution,
            ActionCollectionService actionCollectionService,
            NewActionService newActionService,
            AnalyticsService analyticsService,
            ResponseUtils responseUtils,
            ActionCollectionRepository actionCollectionRepository,
            PagePermission pagePermission,
            ActionPermission actionPermission) {
        super(
                newPageService,
                layoutActionService,
                updateLayoutService,
                refactoringSolution,
                actionCollectionService,
                newActionService,
                analyticsService,
                responseUtils,
                actionCollectionRepository,
                pagePermission,
                actionPermission);
    }
}
