package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Organization;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import static com.appsmith.server.domains.Organization.Fields.organizationConfiguration_isRestartRequired;

@Slf4j
public class CustomOrganizationRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Organization>
        implements CustomOrganizationRepositoryCE {

    @Override
    public Mono<Integer> disableRestartForAllTenants() {
        log.info("Disabling restart for all tenants");
        return queryBuilder()
            .criteria(Bridge.isTrue(organizationConfiguration_isRestartRequired))
            .updateAll(Bridge.update().set(organizationConfiguration_isRestartRequired, false));
    }

}
