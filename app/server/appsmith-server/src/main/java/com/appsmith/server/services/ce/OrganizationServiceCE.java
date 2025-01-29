package com.appsmith.server.services.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.OrganizationConfiguration;
import com.appsmith.server.services.CrudService;
import reactor.core.publisher.Mono;

public interface OrganizationServiceCE extends CrudService<Organization, String> {

    Mono<String> getDefaultOrganizationId();

    Mono<Organization> updateOrganizationConfiguration(
            String organizationId, OrganizationConfiguration organizationConfiguration);

    Mono<Organization> findById(String organizationId, AclPermission permission);

    Mono<Organization> getOrganizationConfiguration(Mono<Organization> dbOrganizationMono);

    Mono<Organization> getOrganizationConfiguration();

    Mono<Organization> getDefaultOrganization();

    Mono<Organization> updateDefaultOrganizationConfiguration(OrganizationConfiguration organizationConfiguration);

    Mono<Organization> save(Organization organization);

    Mono<Organization> checkAndExecuteMigrationsForOrganizationFeatureFlags(Organization organization);

    Mono<Organization> retrieveById(String id);

    Mono<Void> restartOrganization();
}
