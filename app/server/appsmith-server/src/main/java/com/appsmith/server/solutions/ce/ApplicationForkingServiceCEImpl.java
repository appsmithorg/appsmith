package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.AnalyticsEvents;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.solutions.ExamplesOrganizationCloner;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collections;
import java.util.Map;


@RequiredArgsConstructor
@Slf4j
public class ApplicationForkingServiceCEImpl implements ApplicationForkingServiceCE {

    private final ApplicationService applicationService;
    private final OrganizationService organizationService;
    private final ExamplesOrganizationCloner examplesOrganizationCloner;
    private final PolicyUtils policyUtils;
    private final SessionUserService sessionUserService;
    private final AnalyticsService analyticsService;
    private final ResponseUtils responseUtils;

    public Mono<Application> forkApplicationToOrganization(String srcApplicationId, String targetOrganizationId) {
        final Mono<Application> sourceApplicationMono = applicationService.findById(srcApplicationId, AclPermission.READ_APPLICATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, srcApplicationId)));

        final Mono<Organization> targetOrganizationMono = organizationService.findById(targetOrganizationId, AclPermission.ORGANIZATION_MANAGE_APPLICATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ORGANIZATION, targetOrganizationId)));

        Mono<User> userMono = sessionUserService.getCurrentUser();

        Mono<Application> forkApplicationMono = Mono.zip(sourceApplicationMono, targetOrganizationMono, userMono)
                .flatMap(tuple -> {
                    final Application application = tuple.getT1();
                    final Organization targetOrganization = tuple.getT2();
                    final User user = tuple.getT3();

                    //If the forking application is connected to git, do not copy those data to the new forked application
                    application.setGitApplicationMetadata(null);

                    boolean allowFork = (
                            // Is this a non-anonymous user that has access to this application?
                            !user.isAnonymous()
                                    && policyUtils.isPermissionPresentForUser(application.getPolicies(), AclPermission.MANAGE_APPLICATIONS.getValue(), user.getEmail())
                    )
                            || Boolean.TRUE.equals(application.getForkingEnabled());

                    if (!allowFork) {
                        return Mono.error(new AppsmithException(AppsmithError.APPLICATION_FORKING_NOT_ALLOWED));
                    }

                    return examplesOrganizationCloner.cloneApplications(
                            targetOrganization.getId(),
                            Flux.fromIterable(Collections.singletonList(application))
                    );
                })
                .flatMap(applicationIds -> {
                    final String newApplicationId = applicationIds.get(0);
                    return applicationService.getById(newApplicationId)
                            .flatMap(application ->
                                    sendForkApplicationAnalyticsEvent(srcApplicationId, targetOrganizationId, application));
                });

        // Fork application is currently a slow API because it needs to create application, clone all the pages, and then
        // copy all the actions and collections. This process may take time and the client may cancel the request.
        // This leads to the flow getting stopped mid way producing corrupted DB objects. The following ensures that even
        // though the client may have cancelled the flow, the forking of the application should proceed uninterrupted
        // and whenever the user refreshes the page, the sane forked application is available.
        // To achieve this, we use a synchronous sink which does not take subscription cancellations into account. This
        // means that even if the subscriber has cancelled its subscription, the create method still generates its event.
        return Mono.create(sink -> forkApplicationMono
                .subscribe(sink::success, sink::error, null, sink.currentContext())
        );
    }

    public Mono<Application> forkApplicationToOrganization(String srcApplicationId,
                                                           String targetOrganizationId,
                                                           String branchName) {
        return applicationService.findBranchedApplicationId(branchName, srcApplicationId, AclPermission.READ_APPLICATIONS)
                .flatMap(branchedApplicationId -> forkApplicationToOrganization(branchedApplicationId, targetOrganizationId))
                .map(responseUtils::updateApplicationWithDefaultResources);
    }

    private Mono<Application> sendForkApplicationAnalyticsEvent(String applicationId, String orgId, Application application) {
        return applicationService.findById(applicationId, AclPermission.READ_APPLICATIONS)
                .flatMap(sourceApplication -> {

                    final Map<String, Object> data = Map.of(
                            "forkedFromAppId", applicationId,
                            "forkedToOrgId", orgId,
                            "forkedFromAppName", sourceApplication.getName()
                    );

                    return analyticsService.sendObjectEvent(AnalyticsEvents.FORK, application, data);
                })
                .onErrorResume(e -> {
                    log.warn("Error sending action execution data point", e);
                    return Mono.just(application);
                });
    }

}
