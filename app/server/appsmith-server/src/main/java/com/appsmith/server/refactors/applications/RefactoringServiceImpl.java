package com.appsmith.server.refactors.applications;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.refactors.entities.EntityRefactoringService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.validations.EntityValidationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class RefactoringServiceImpl extends RefactoringServiceCEImpl implements RefactoringService {

    public RefactoringServiceImpl(
            NewPageService newPageService,
            UpdateLayoutService updateLayoutService,
            ApplicationService applicationService,
            PagePermission pagePermission,
            AnalyticsService analyticsService,
            SessionUserService sessionUserService,
            EntityValidationService entityValidationService,
            EntityRefactoringService<Void> jsActionEntityRefactoringService,
            EntityRefactoringService<NewAction> newActionEntityRefactoringService,
            EntityRefactoringService<ActionCollection> actionCollectionEntityRefactoringService,
            EntityRefactoringService<Layout> widgetEntityRefactoringService) {
        super(
                newPageService,
                updateLayoutService,
                applicationService,
                pagePermission,
                analyticsService,
                sessionUserService,
                entityValidationService,
                jsActionEntityRefactoringService,
                newActionEntityRefactoringService,
                actionCollectionEntityRefactoringService,
                widgetEntityRefactoringService);
    }
}
