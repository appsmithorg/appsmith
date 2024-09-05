package com.appsmith.server.services;

import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.refactors.applications.RefactoringService;
import com.appsmith.server.services.ce.LayoutActionServiceCEImpl;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.PagePermission;
import io.micrometer.observation.ObservationRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class LayoutActionServiceImpl extends LayoutActionServiceCEImpl implements LayoutActionService {

    public LayoutActionServiceImpl(
            AnalyticsService analyticsService,
            NewPageService newPageService,
            NewActionService newActionService,
            RefactoringService refactoringService,
            CollectionService collectionService,
            UpdateLayoutService updateLayoutService,
            DatasourceService datasourceService,
            PagePermission pagePermission,
            ActionPermission actionPermission,
            ObservationRegistry observationRegistry) {

        super(
                analyticsService,
                newPageService,
                newActionService,
                refactoringService,
                collectionService,
                updateLayoutService,
                datasourceService,
                pagePermission,
                actionPermission,
                observationRegistry);
    }
}
