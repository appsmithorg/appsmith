package com.appsmith.server.solutions;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.AnalyticsEvents;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.SessionUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collections;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ApplicationForkingService {

    private final ApplicationService applicationService;
    private final OrganizationService organizationService;
    private final ExamplesOrganizationCloner examplesOrganizationCloner;
    private final PolicyUtils policyUtils;
    private final SessionUserService sessionUserService;
    private final AnalyticsService analyticsService;

    public Mono<Application> forkApplicationToOrganization(String srcApplicationId, String targetOrganizationId) {
        final Mono<Application> sourceApplicationMono = applicationService.findById(srcApplicationId, AclPermission.READ_APPLICATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, "application", srcApplicationId)));

        final Mono<Organization> targetOrganizationMono = organizationService.findById(targetOrganizationId, AclPermission.ORGANIZATION_MANAGE_APPLICATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, "organization", targetOrganizationId)));

        Mono<User> userMono = sessionUserService.getCurrentUser();

        return Mono.zip(sourceApplicationMono, targetOrganizationMono, userMono)
                .flatMap(tuple -> {
                    final Application application = tuple.getT1();
                    final Organization targetOrganization = tuple.getT2();
                    final User user = tuple.getT3();

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
