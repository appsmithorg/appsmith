package com.appsmith.server.applications.solutions;

import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.PagePermission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Slf4j
@Component
public class ApplicationSolutionCEImpl implements ApplicationSolutionCE {

    private final ApplicationRepository applicationRepository;

    private final NewPageService newPageService;

    private final NewActionService newActionService;

    private final ActionCollectionService actionCollectionService;

    private final ApplicationPermission applicationPermission;

    private final PagePermission pagePermission;

    private final ActionPermission actionPermission;

    public ApplicationSolutionCEImpl(
            ApplicationRepository applicationRepository,
            NewPageService newPageService,
            NewActionService newActionService,
            ActionCollectionService actionCollectionService,
            ApplicationPermission applicationPermission,
            PagePermission pagePermission,
            ActionPermission actionPermission) {
        this.applicationRepository = applicationRepository;
        this.newPageService = newPageService;
        this.newActionService = newActionService;
        this.actionCollectionService = actionCollectionService;
        this.applicationPermission = applicationPermission;
        this.pagePermission = pagePermission;
        this.actionPermission = actionPermission;
    }

    @Override
    public Mono<Void> archiveApplicationAndItsComponents(String applicationId) {

        // We are not archiving the datasource associated only with the use-case
        return applicationRepository
                .findById(applicationId, applicationPermission.getDeletePermission())
                .flatMap(application -> applicationRepository.archiveById(applicationId))
                .flatMap(isApplicationDeleted ->
                        newPageService.archivePagesByApplicationId(applicationId, pagePermission.getDeletePermission()))
                .flatMap(archivedPageList -> newActionService.archiveActionsByApplicationId(
                        applicationId, actionPermission.getDeletePermission()))
                .flatMap(archivedActionList -> actionCollectionService.archiveActionCollectionByApplicationId(
                        applicationId, actionPermission.getDeletePermission()))
                .then();
    }
}
