package com.appsmith.server.configurations.git;

import com.appsmith.external.configurations.git.GitConfigCE;
import com.appsmith.server.services.OrganizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@Component
public class GitConfigCEImpl implements GitConfigCE {

    private final OrganizationService tenantService;

    @Override
    public Mono<Boolean> getIsAtomicPushAllowed() {
        return tenantService
                .getOrganizationConfiguration()
                .map(tenant -> tenant.getOrganizationConfiguration().getIsAtomicPushAllowed())
                .switchIfEmpty(Mono.just(false));
    }
}
