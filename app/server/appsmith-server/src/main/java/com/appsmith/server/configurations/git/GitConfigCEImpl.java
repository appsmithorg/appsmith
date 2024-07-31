package com.appsmith.server.configurations.git;

import com.appsmith.external.configurations.git.GitConfigCE;
import com.appsmith.server.services.TenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@Component
public class GitConfigCEImpl implements GitConfigCE {

    private final TenantService tenantService;

    @Override
    public Mono<Boolean> getIsAtomicPushAllowed() {
        return tenantService
                .getTenantConfiguration()
                .map(tenant -> tenant.getTenantConfiguration().getIsAtomicPushAllowed())
                .switchIfEmpty(Mono.just(false));
    }
}
