package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Organization;
import org.springframework.data.domain.Sort;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Set;

public interface CustomOrganizationRepository extends AppsmithRepository<Organization> {

    Mono<Organization> findByName(String name, AclPermission aclPermission);

    Flux<Organization> findByIdsIn(Set<String> orgIds, AclPermission aclPermission, Sort sort);

    Mono<Long> nextSlugNumber(String slugPrefix);

    Mono<Void> updateUserRoleNames(String userId, String userName);

    Flux<Organization> findAllOrganizations();
}
