package com.appsmith.server.helpers;

import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.TenantService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@AllArgsConstructor
@Component
public class TenantUtils {
    private final TenantService tenantService;

    public Mono<Boolean> enterpriseUpgradeRequired() {
        return tenantService
                .getDefaultTenantId()
                .flatMap(tenantService::isEnterprisePlan)
                .flatMap(isEnterprisePlan -> {
                    if (!Boolean.TRUE.equals(isEnterprisePlan)) {
                        return Mono.error(new AppsmithException(AppsmithError.LICENSE_UPGRADE_REQUIRED));
                    }
                    return Mono.just(Boolean.TRUE);
                });
    }
}
