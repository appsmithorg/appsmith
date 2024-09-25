package com.appsmith.server.services;

import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.refactors.applications.RefactoringService;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.services.ce.LayoutCollectionServiceCEImpl;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.PagePermission;
import io.micrometer.observation.ObservationRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class LayoutCollectionServiceImpl extends LayoutCollectionServiceCEImpl implements LayoutCollectionService {

    public LayoutCollectionServiceImpl(
            NewPageService newPageService,
            LayoutActionService layoutActionService,
            UpdateLayoutService updateLayoutService,
            RefactoringService refactoringService,
            ActionCollectionService actionCollectionService,
            NewActionService newActionService,
            AnalyticsService analyticsService,
            ActionCollectionRepository actionCollectionRepository,
            PagePermission pagePermission,
            ActionPermission actionPermission,
            ObservationRegistry observationRegistry) {
        super(
                newPageService,
                layoutActionService,
                updateLayoutService,
                refactoringService,
                actionCollectionService,
                newActionService,
                analyticsService,
                actionCollectionRepository,
                pagePermission,
                actionPermission,
                observationRegistry);
    }
}
