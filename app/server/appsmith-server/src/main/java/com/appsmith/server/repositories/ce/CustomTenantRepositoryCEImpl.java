package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Tenant;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import static com.appsmith.server.domains.Tenant.Fields.tenantConfiguration_isRestartRequired;

@Slf4j
public class CustomTenantRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Tenant>
        implements CustomTenantRepositoryCE {

    @Override
    public Mono<Integer> disableRestartForAllTenants() {
        log.info("Disabling restart for all tenants");
        return queryBuilder()
                .criteria(Bridge.isTrue(tenantConfiguration_isRestartRequired))
                .updateAll(Bridge.update().set(tenantConfiguration_isRestartRequired, false));
    }
}
