package com.appsmith.server.configurations.git;

import com.appsmith.external.configurations.git.GitConfigCE;
import com.appsmith.server.services.OrganizationService;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
public class GitConfigCEImpl implements GitConfigCE {

    protected final OrganizationService organizationService;

    public GitConfigCEImpl(OrganizationService organizationService) {
        this.organizationService = organizationService;
    }

    @Override
    public Mono<Boolean> getIsAtomicPushAllowed() {
        return organizationService
                .getOrganizationConfiguration()
                .map(organization -> organization.getOrganizationConfiguration().getIsAtomicPushAllowed())
                .switchIfEmpty(Mono.just(false));
    }

    /**
     * Returns whether SSH proxy should be disabled.
     *
     * <p>CE (Community Edition) always returns false (proxy enabled).
     * This feature is only available in EE (Enterprise Edition).
     *
     * @return Mono&lt;Boolean&gt; - always false in CE (proxy enabled)
     */
    @Override
    public Mono<Boolean> isSshProxyDisabled() {
        return Mono.just(false);
    }
}
