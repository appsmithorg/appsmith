package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.query.UpdateDefinition;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@RequiredArgsConstructor
public class CustomPermissionGroupRepositoryCEImpl extends BaseAppsmithRepositoryImpl<PermissionGroup>
        implements CustomPermissionGroupRepositoryCE {

    private final CacheableRepositoryHelper cacheableRepositoryHelper;

    @Override
    public Flux<PermissionGroup> findAllByAssignedToUserIdAndDefaultWorkspaceId(
            String userId, String workspaceId, AclPermission permission) {
        BridgeQuery<PermissionGroup> query = Bridge.<PermissionGroup>in(
                        PermissionGroup.Fields.assignedToUserIds, List.of(userId))
                .equal(PermissionGroup.Fields.defaultDomainId, workspaceId)
                .equal(PermissionGroup.Fields.defaultDomainType, Workspace.class.getSimpleName());

        return queryBuilder().criteria(query).permission(permission).all();
    }

    @Override
    public Mono<Integer> updateById(String id, UpdateDefinition updateObj) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }
        return queryBuilder().byId(id).updateFirst(updateObj);
    }

    @Override
    public Flux<PermissionGroup> findByDefaultWorkspaceId(String workspaceId, AclPermission permission) {
        BridgeQuery<PermissionGroup> query = Bridge.<PermissionGroup>equal(
                        PermissionGroup.Fields.defaultDomainId, workspaceId)
                .equal(PermissionGroup.Fields.defaultDomainType, Workspace.class.getSimpleName());
        return queryBuilder().criteria(query).permission(permission).all();
    }

    @Override
    public Flux<PermissionGroup> findByDefaultWorkspaceIds(Set<String> workspaceIds, AclPermission permission) {
        BridgeQuery<PermissionGroup> query = Bridge.<PermissionGroup>in(
                        PermissionGroup.Fields.defaultDomainId, workspaceIds)
                .equal(PermissionGroup.Fields.defaultDomainType, Workspace.class.getSimpleName());
        return queryBuilder().criteria(query).permission(permission).all();
    }

    @Override
    public Mono<Void> evictPermissionGroupsUser(String email, String organizationId) {
        return cacheableRepositoryHelper.evictPermissionGroupsUser(email, organizationId);
    }

    @Override
    public Mono<Void> evictAllPermissionGroupCachesForUser(String email, String organizationId) {
        return this.evictPermissionGroupsUser(email, organizationId);
    }

    @Override
    public Mono<Set<String>> getCurrentUserPermissionGroups() {
        return super.getCurrentUserPermissionGroups();
    }

    @Override
    public Mono<Set<String>> getAllPermissionGroupsIdsForUser(User user) {
        return super.getAllPermissionGroupsForUser(user);
    }

    @Override
    public Flux<PermissionGroup> findAllByAssignedToUserIn(
            Set<String> userIds, Optional<List<String>> includeFields, Optional<AclPermission> permission) {
        BridgeQuery<PermissionGroup> assignedToUserIdCriteria =
                Bridge.in(PermissionGroup.Fields.assignedToUserIds, userIds);
        return queryBuilder()
                .criteria(assignedToUserIdCriteria)
                .fields(includeFields.orElse(null))
                .permission(permission.orElse(null))
                .all();
    }
}
