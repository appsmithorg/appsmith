package com.appsmith.server.services.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.OrganizationConfiguration;
import com.appsmith.server.services.CrudService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface OrganizationServiceCE extends CrudService<Organization, String> {

    Mono<String> getCurrentUserOrganizationId();

    Mono<Organization> updateOrganizationConfiguration(
            String organizationId, OrganizationConfiguration organizationConfiguration);

    Mono<Organization> findById(String organizationId, AclPermission permission);

    Mono<Organization> getOrganizationConfiguration(Mono<Organization> dbOrganizationMono);

    Mono<Organization> getOrganizationConfiguration();

    Mono<Organization> getCurrentUserOrganization();

    Mono<Organization> updateOrganizationConfiguration(OrganizationConfiguration organizationConfiguration);

    Mono<Organization> save(Organization organization);

    Mono<Organization> checkAndExecuteMigrationsForOrganizationFeatureFlags(Organization organization);

    Mono<Organization> retrieveById(String id);

    Flux<Organization> retrieveAll();

    /**
     * Runs at server startup. Creates {@code APPSMITH_MCP_INTERNAL_SECRET} when an organization has MCP on and the
     * backend has no secret. Does nothing when MCP is off. Never fails.
     */
    Mono<Void> repairMcpInternalSecretOnStartup();
}
