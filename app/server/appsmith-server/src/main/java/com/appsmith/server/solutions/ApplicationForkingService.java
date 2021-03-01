package com.appsmith.server.solutions;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.OrganizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class ApplicationForkingService {

    private final ApplicationService applicationService;
    private final OrganizationService organizationService;
    private final ExamplesOrganizationCloner examplesOrganizationCloner;

    public Mono<Application> forkApplicationToOrganization(String applicationId, String organizationId) {
        final Mono<Application> sourceApplicationMono = applicationService.findById(applicationId, AclPermission.READ_APPLICATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, "application", applicationId)));

        final Mono<Organization> targetOrganizationMono = organizationService.findById(organizationId, AclPermission.ORGANIZATION_MANAGE_APPLICATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, "organization", organizationId)));

        return Mono.zip(sourceApplicationMono, targetOrganizationMono)
                .flatMap(tuple -> {
                    final Application application = tuple.getT1();
                    final Organization targetOrganization = tuple.getT2();
                    if (!Boolean.TRUE.equals(application.getForkingEnabled())) {
                        return Mono.error(new AppsmithException(AppsmithError.APPLICATION_FORKING_NOT_ALLOWED));
                    }
                    return examplesOrganizationCloner.cloneApplications(
                            application.getOrganizationId(),
                            targetOrganization.getId(),
                            Flux.fromIterable(Collections.singletonList(application))
                    );
                })
                .flatMap(applicationIds -> {
                    final String newApplicationId = applicationIds.get(0);
                    return applicationService.getById(newApplicationId);
                });
    }

}
