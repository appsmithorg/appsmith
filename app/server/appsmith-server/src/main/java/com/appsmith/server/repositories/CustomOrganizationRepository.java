package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Organization;
import reactor.core.publisher.Mono;

public interface CustomOrganizationRepository extends AppsmithRepository<Organization> {

    Mono<Organization> findByName(String name, AclPermission aclPermission);

    Mono<Organization> findByIdAndPluginsPluginId(String organizationId, String pluginId, AclPermission aclPermission);

}
