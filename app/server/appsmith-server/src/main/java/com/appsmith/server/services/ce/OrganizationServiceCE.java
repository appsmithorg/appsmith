package com.appsmith.server.services.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserRole;
import com.appsmith.server.services.CrudService;
import org.springframework.http.codec.multipart.Part;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Set;

public interface OrganizationServiceCE extends CrudService<Workspace, String> {

    Mono<Workspace> create(Workspace organization);

    Mono<Workspace> getBySlug(String slug);

    Mono<String> getNextUniqueSlug(String initialSlug);

    Mono<Workspace> createDefault(Workspace organization, User user);

    Mono<Workspace> create(Workspace organization, User user);

    Mono<Workspace> findById(String id, AclPermission permission);

    Mono<Workspace> save(Workspace organization);

    Mono<Workspace> findByIdAndPluginsPluginId(String organizationId, String pluginId);

    Flux<Workspace> findByIdsIn(Set<String> ids,AclPermission permission);

    Mono<Map<String, String>> getUserRolesForOrganization(String orgId);

    Mono<List<UserRole>> getOrganizationMembers(String orgId);

    Mono<Workspace> uploadLogo(String organizationId, Part filePart);

    Mono<Workspace> deleteLogo(String organizationId);

    Flux<Workspace> getAll();

    Mono<Workspace> archiveById(String s);
}
