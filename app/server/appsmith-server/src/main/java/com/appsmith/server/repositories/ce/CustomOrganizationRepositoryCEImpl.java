package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import static com.appsmith.server.domains.Organization.Fields.organizationConfiguration_isRestartRequired;

@Slf4j
public class CustomOrganizationRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Organization>
        implements CustomOrganizationRepositoryCE {

    @Override
    public Mono<Integer> disableRestartForAllOrganizations() {
        log.info("Disabling restart for all organizations");
        return queryBuilder()
                .criteria(Bridge.isTrue(organizationConfiguration_isRestartRequired))
                .updateAll(Bridge.update().set(organizationConfiguration_isRestartRequired, false));
    }

    @Override
    public Mono<Organization> findByIdAsUser(User user, String id, AclPermission permission) {
        return getAllPermissionGroupsForUser(user).flatMap(permissionGroups -> queryBuilder()
                .criteria(Bridge.equal(BaseDomain.Fields.id, id))
                .permission(permission)
                .permissionGroups(permissionGroups)
                .one());
    }
}
