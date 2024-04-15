package com.appsmith.server.applications.solutions;

import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.PagePermission;

public class ApplicationSolutionImpl extends ApplicationSolutionCECompatibleImpl implements ApplicationSolution {

    public ApplicationSolutionImpl(
            ApplicationRepository applicationRepository,
            NewPageService newPageService,
            NewActionService newActionService,
            ActionCollectionService actionCollectionService,
            ApplicationPermission applicationPermission,
            PagePermission pagePermission,
            ActionPermission actionPermission) {
        super(
                applicationRepository,
                newPageService,
                newActionService,
                actionCollectionService,
                applicationPermission,
                pagePermission,
                actionPermission);
    }
}
