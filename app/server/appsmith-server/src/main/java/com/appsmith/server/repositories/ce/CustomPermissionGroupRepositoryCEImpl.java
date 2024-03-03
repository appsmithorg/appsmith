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
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.springframework.data.mongodb.core.query.Criteria.where;

public class CustomPermissionGroupRepositoryCEImpl extends BaseAppsmithRepositoryImpl<PermissionGroup>
        implements CustomPermissionGroupRepositoryCE {

    private final EntityManager entityManager;

    public CustomPermissionGroupRepositoryCEImpl(
            EntityManager entityManager,
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
        this.entityManager = entityManager;
    }

    @Override
    public List<PermissionGroup> findByAssignedToUserIdsIn(String userId) {
        return queryBuilder()
                .criteria(Bridge.query().jsonIn(userId, PermissionGroup.Fields.assignedToUserIds))
                .all();
    }

    @Override
    public List<PermissionGroup> findAllByAssignedToUserIdAndDefaultWorkspaceId(
            String userId, String workspaceId, AclPermission permission) {
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
        Criteria defaultWorkspaceIdCriteria =
                where(PermissionGroup.Fields.defaultDomainId).is(workspaceId);
        Criteria defaultDomainTypeCriteria =
                where(PermissionGroup.Fields.defaultDomainType).is(Workspace.class.getSimpleName());
        return queryBuilder()
                .criteria(defaultWorkspaceIdCriteria, defaultDomainTypeCriteria)
                .permission(permission)
                .all();
    }

    @Override
    public List<PermissionGroup> findByDefaultWorkspaceIds(Set<String> workspaceIds, AclPermission permission) {
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
        Criteria assignedToUserIdCriteria =
                where(PermissionGroup.Fields.assignedToUserIds).in(userIds);
        return queryBuilder()
                .criteria(assignedToUserIdCriteria)
                .fields(includeFields.orElse(null))
                .permission(permission.orElse(null))
                .all();
    }
}
