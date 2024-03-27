package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeUpdate;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Update;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public class CustomPermissionGroupRepositoryCEImpl extends BaseAppsmithRepositoryImpl<PermissionGroup>
        implements CustomPermissionGroupRepositoryCE {

    public CustomPermissionGroupRepositoryCEImpl(CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(cacheableRepositoryHelper);
    }

    @Override
    public List<PermissionGroup> findByAssignedToUserIdsIn(String userId) {
        return queryBuilder()
                .criteria(Bridge.jsonIn(userId, PermissionGroup.Fields.assignedToUserIds))
                .all();
    }

    @Override
    public List<PermissionGroup> findAllByAssignedToUserIdAndDefaultWorkspaceId(
            String userId, String workspaceId, AclPermission permission) {
        BridgeQuery<PermissionGroup> assignedToUserIdCriteria =
                Bridge.in(PermissionGroup.Fields.assignedToUserIds, List.of(userId));

        BridgeQuery<PermissionGroup> defaultWorkspaceIdCriteria =
                Bridge.equal(PermissionGroup.Fields.defaultDomainId, workspaceId);

        BridgeQuery<PermissionGroup> defaultDomainTypeCriteria =
                Bridge.equal(PermissionGroup.Fields.defaultDomainType, Workspace.class.getSimpleName());

        // TODO(Shri): Why manual spec function here?
        return queryBuilder()
                .criteria((root, cq, cb) -> cb.and(
                        cb.isTrue(cb.function(
                                "jsonb_path_exists",
                                Boolean.class,
                                root.get(PermissionGroup.Fields.assignedToUserIds),
                                cb.literal("$[*] ? (@ == \"" + userId + "\")"))),
                        cb.equal(root.get(PermissionGroup.Fields.defaultDomainId), workspaceId),
                        cb.equal(root.get(PermissionGroup.Fields.defaultDomainType), Workspace.class.getSimpleName())))
                .permission(permission)
                .all();
    }

    @Override
    @Transactional
    @Modifying
    public int updateById(String id, BridgeUpdate updateObj) {
        if (id == null) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID);
        }
        return queryBuilder().byId(id).updateFirst(updateObj);
    }

    @Override
    public List<PermissionGroup> findByDefaultWorkspaceId(String workspaceId, AclPermission permission) {
        BridgeQuery<PermissionGroup> defaultWorkspaceIdCriteria =
                Bridge.equal(PermissionGroup.Fields.defaultDomainId, workspaceId);
        BridgeQuery<PermissionGroup> defaultDomainTypeCriteria =
                Bridge.equal(PermissionGroup.Fields.defaultDomainType, Workspace.class.getSimpleName());
        return queryBuilder()
                .criteria(Bridge.equal(PermissionGroup.Fields.defaultDomainId, workspaceId)
                        .equal(PermissionGroup.Fields.defaultDomainType, Workspace.class.getSimpleName()))
                .permission(permission)
                .all();
    }

    @Override
    public List<PermissionGroup> findByDefaultWorkspaceIds(Set<String> workspaceIds, AclPermission permission) {
        BridgeQuery<PermissionGroup> defaultWorkspaceIdCriteria =
                Bridge.in(PermissionGroup.Fields.defaultDomainId, workspaceIds);
        BridgeQuery<PermissionGroup> defaultDomainTypeCriteria =
                Bridge.equal(PermissionGroup.Fields.defaultDomainType, Workspace.class.getSimpleName());
        return queryBuilder()
                .criteria(Bridge.query()
                        .equal(PermissionGroup.Fields.defaultDomainType, Workspace.class.getSimpleName())
                        .in(PermissionGroup.Fields.defaultDomainId, workspaceIds))
                .permission(permission)
                .all();
    }

    @Override
    public Optional<Void> evictPermissionGroupsUser(String email, String tenantId) {
        return cacheableRepositoryHelper
                .evictPermissionGroupsUser(email, tenantId)
                .blockOptional();
    }

    @Override
    public Optional<Void> evictAllPermissionGroupCachesForUser(String email, String tenantId) {
        return this.evictPermissionGroupsUser(email, tenantId);
    }

    @Override
    public Set<String> getCurrentUserPermissionGroups() {
        return super.getCurrentUserPermissionGroups();
    }

    @Override
    public Set<String> getAllPermissionGroupsIdsForUser(User user) {
        return super.getAllPermissionGroupsForUser(user);
    }

    @Override
    public List<PermissionGroup> findAllByAssignedToUserIn(
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
