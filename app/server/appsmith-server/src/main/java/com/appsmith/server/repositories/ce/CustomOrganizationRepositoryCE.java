package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.repositories.AppsmithRepository;
import org.springframework.data.domain.Sort;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Set;

public interface CustomOrganizationRepositoryCE extends AppsmithRepository<Workspace> {

    Mono<Workspace> findByName(String name, AclPermission aclPermission);

    Flux<Workspace> findByIdsIn(Set<String> orgIds, AclPermission aclPermission, Sort sort);

    Mono<Long> nextSlugNumber(String slugPrefix);

    Mono<Void> updateUserRoleNames(String userId, String userName);

    Flux<Workspace> findAllOrganizations();
}
