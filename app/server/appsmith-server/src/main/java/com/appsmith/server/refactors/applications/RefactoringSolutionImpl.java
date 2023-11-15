package com.appsmith.server.refactors.applications;

import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.refactors.entities.EntityRefactoringService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.solutions.PagePermission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.reactive.TransactionalOperator;

@Service
@Slf4j
public class RefactoringSolutionImpl extends RefactoringSolutionCEImpl implements RefactoringSolution {

    public RefactoringSolutionImpl(
            NewPageService newPageService,
            ResponseUtils responseUtils,
            LayoutActionService layoutActionService,
            ApplicationService applicationService,
            PagePermission pagePermission,
            AnalyticsService analyticsService,
            SessionUserService sessionUserService,
            TransactionalOperator transactionalOperator,
            EntityRefactoringService<Void> jsActionEntityRefactoringService,
            EntityRefactoringService<NewAction> newActionEntityRefactoringService,
            EntityRefactoringService<ActionCollection> actionCollectionEntityRefactoringService,
            EntityRefactoringService<Layout> widgetEntityRefactoringService) {
        super(
                newPageService,
                responseUtils,
                layoutActionService,
                applicationService,
                pagePermission,
                analyticsService,
                sessionUserService,
                transactionalOperator,
                jsActionEntityRefactoringService,
                newActionEntityRefactoringService,
                actionCollectionEntityRefactoringService,
                widgetEntityRefactoringService);
    }
}
