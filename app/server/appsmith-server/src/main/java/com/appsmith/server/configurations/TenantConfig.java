package com.appsmith.server.configurations;

import com.appsmith.server.domains.Tenant;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.repositories.TenantRepository;
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
public class TenantConfig implements ApplicationListener<ApplicationStartedEvent> {

    private final TenantRepository tenantRepository;

    // Method to cleanup the cache and update the default tenant policies if the policyMap is empty. This will make sure
    // cache will be updated if we update the tenant via startup DB migrations.
    private Mono<Tenant> cleanupAndUpdateRefreshDefaultTenantPolicies() {
        log.debug("Cleaning up and updating default tenant policies on server startup");
        return tenantRepository.findBySlug("default").flatMap(tenant -> {
            if (CollectionUtils.isNullOrEmpty(tenant.getPolicyMap())) {
                tenant.setPolicyMap(policySetToMap(tenant.getPolicies()));
                return this.tenantRepository.save(tenant);
            }
            return Mono.just(tenant);
        });
    }

    @Override
    public void onApplicationEvent(ApplicationStartedEvent event) {
        cleanupAndUpdateRefreshDefaultTenantPolicies().block();
    }
}
