
package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.PagedDomain;
import com.appsmith.server.repositories.ce.CustomUserRepositoryCE;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;

public interface CustomUserRepository extends CustomUserRepositoryCE {

    Flux<String> getAllUserEmail(String defaultTenantId);

    Flux<User> getAllUserObjectsWithEmail(String defaultTenantId, Optional<AclPermission> aclPermission);

    Mono<PagedDomain<User>> getUsersWithParamsPaginated(
            int count, int startIndex, List<String> filterEmails, Optional<AclPermission> aclPermission);

    Flux<String> getUserEmailsByIdsAndTenantId(
            List<String> userIds, String tenantId, Optional<AclPermission> aclPermission);
}
