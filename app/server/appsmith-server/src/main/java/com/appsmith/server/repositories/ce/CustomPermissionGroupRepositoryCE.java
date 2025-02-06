package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.AppsmithRepository;
import org.springframework.data.mongodb.core.query.UpdateDefinition;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface CustomPermissionGroupRepositoryCE extends AppsmithRepository<PermissionGroup> {

    Flux<PermissionGroup> findAllByAssignedToUserIdAndDefaultWorkspaceId(
            String userId, String workspaceId, AclPermission permission);

    Mono<Integer> updateById(String id, UpdateDefinition updateObj);

    Flux<PermissionGroup> findByDefaultWorkspaceId(String workspaceId, AclPermission permission);

    Flux<PermissionGroup> findByDefaultWorkspaceIds(Set<String> workspaceIds, AclPermission permission);

    Mono<Void> evictPermissionGroupsUser(String email, String organizationId);

    Mono<Void> evictAllPermissionGroupCachesForUser(String email, String organizationId);

    Flux<PermissionGroup> findAllByAssignedToUserIn(
            Set<String> userIds, Optional<List<String>> includeFields, Optional<AclPermission> permission);

    Mono<Set<String>> getCurrentUserPermissionGroups();

    Mono<Set<String>> getAllPermissionGroupsIdsForUser(User user);
}
