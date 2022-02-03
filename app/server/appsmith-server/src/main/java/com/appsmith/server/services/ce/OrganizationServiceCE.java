package com.appsmith.server.services.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserRole;
import com.appsmith.server.services.CrudService;
import org.springframework.http.codec.multipart.Part;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Set;

public interface OrganizationServiceCE extends CrudService<Organization, String> {

    Mono<Organization> create(Organization organization);

    Mono<Organization> getBySlug(String slug);

    Mono<String> getNextUniqueSlug(String initialSlug);

    Mono<Organization> createDefault(Organization organization, User user);

    Mono<Organization> create(Organization organization, User user);

    Mono<Organization> findById(String id, AclPermission permission);

    Mono<Organization> save(Organization organization);

    Mono<Organization> findByIdAndPluginsPluginId(String organizationId, String pluginId);

    Flux<Organization> findByIdsIn(Set<String> ids,AclPermission permission);

    Mono<Map<String, String>> getUserRolesForOrganization(String orgId);

    Mono<List<UserRole>> getOrganizationMembers(String orgId);

    Mono<Organization> uploadLogo(String organizationId, Part filePart);

    Mono<Organization> deleteLogo(String organizationId);

    Flux<Organization> getAll();

    Mono<Organization> delete(String s);
}
