package com.appsmith.server.configurations;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.repositories.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationStartedEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.context.annotation.Configuration;
import reactor.core.publisher.Mono;

import static com.appsmith.external.models.BaseDomain.policySetToMap;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class OrganizationConfig implements ApplicationListener<ApplicationStartedEvent> {

    private final OrganizationRepository organizationRepository;
    private final CacheableRepositoryHelper cacheableRepositoryHelper;

    // Method to cleanup the cache and update the default organization policies if the policyMap is empty. This will
    // make sure
    // cache will be updated if we update the organization via startup DB migrations.
    // As we have mocked the OrganizationService in the tests, we had to manually evict the cache and save the object to
    // DB
    private Mono<Organization> cleanupAndUpdateRefreshDefaultOrganizationPolicies() {
        log.debug("Cleaning up and updating default organization policies on server startup");
        return organizationRepository.findBySlug(FieldName.DEFAULT).flatMap(organization -> {
            if (CollectionUtils.isNullOrEmpty(organization.getPolicyMap())) {
                organization.setPolicyMap(policySetToMap(organization.getPolicies()));
                return cacheableRepositoryHelper
                        .evictCachedOrganization(organization.getId())
                        .thenReturn(organizationRepository.save(organization));
            }
            return Mono.just(organization);
        });
    }

    @Override
    public void onApplicationEvent(ApplicationStartedEvent event) {
        cleanupAndUpdateRefreshDefaultOrganizationPolicies().block();
    }
}
