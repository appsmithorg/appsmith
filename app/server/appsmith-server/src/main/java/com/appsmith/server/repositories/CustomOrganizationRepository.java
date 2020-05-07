package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Organization;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Set;

public interface CustomOrganizationRepository extends AppsmithRepository<Organization> {

    Mono<Organization> findByName(String name, AclPermission aclPermission);

    Mono<Organization> findByIdAndPluginsPluginId(String organizationId, String pluginId, AclPermission aclPermission);

    Flux<Organization> findByIdsIn(Set<String> orgIds, AclPermission aclPermission);

}
