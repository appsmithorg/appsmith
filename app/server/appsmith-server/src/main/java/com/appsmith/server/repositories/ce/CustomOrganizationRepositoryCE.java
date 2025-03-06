package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.AppsmithRepository;
import reactor.core.publisher.Mono;

public interface CustomOrganizationRepositoryCE extends AppsmithRepository<Organization> {
    Mono<Integer> disableRestartForAllTenants();

    Mono<Organization> findByIdAsUser(User user, String id, AclPermission permission);
}
