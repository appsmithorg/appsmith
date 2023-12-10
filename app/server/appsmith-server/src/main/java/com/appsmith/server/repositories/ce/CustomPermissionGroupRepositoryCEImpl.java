package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.mongodb.client.result.UpdateResult;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Update;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.springframework.data.mongodb.core.query.Criteria.where;

public class CustomPermissionGroupRepositoryCEImpl extends BaseAppsmithRepositoryImpl<PermissionGroup>
        implements CustomPermissionGroupRepositoryCE {

    public CustomPermissionGroupRepositoryCEImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public List<PermissionGroup> findAllByAssignedToUserIdAndDefaultWorkspaceId(
            String userId, String workspaceId, AclPermission permission) {
        return Collections.emptyList(); /*
        Criteria assignedToUserIdCriteria = where(fieldName(QPermissionGroup.permissionGroup.assignedToUserIds))
                .in(userId);
        Criteria defaultWorkspaceIdCriteria = where("defaultDomainId")
                .is(workspaceId);
        Criteria defaultDomainTypeCriteria = where("defaultDomainType")
                .is(Workspace.class.getSimpleName());
        return queryAll(
                List.of(assignedToUserIdCriteria, defaultWorkspaceIdCriteria, defaultDomainTypeCriteria), permission);*/
    }

    @Override
    public Optional<UpdateResult> updateById(String id, Update updateObj) {
        return Optional.empty(); /*
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }
        Query query = new Query(Criteria.where("id").is(id));
        return mongoOperations.updateFirst(query, updateObj, this.genericDomain);*/
    }

    @Override
    public List<PermissionGroup> findByDefaultWorkspaceId(String workspaceId, AclPermission permission) {
        return Collections.emptyList(); /*
        Criteria defaultWorkspaceIdCriteria = where("defaultDomainId")
                .is(workspaceId);
        Criteria defaultDomainTypeCriteria = where("defaultDomainType")
                .is(Workspace.class.getSimpleName());
        return queryAll(List.of(defaultWorkspaceIdCriteria, defaultDomainTypeCriteria), permission);*/
    }

    @Override
    public List<PermissionGroup> findByDefaultWorkspaceIds(Set<String> workspaceIds, AclPermission permission) {
        return Collections.emptyList(); /*
        Criteria defaultWorkspaceIdCriteria = where("defaultDomainId")
                .in(workspaceIds);
        Criteria defaultDomainTypeCriteria = where("defaultDomainType")
                .is(Workspace.class.getSimpleName());
        return queryAll(List.of(defaultWorkspaceIdCriteria, defaultDomainTypeCriteria), permission);*/
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
        Criteria assignedToUserIdCriteria = where(fieldName(QPermissionGroup.permissionGroup.assignedToUserIds))
                .in(userIds);
        return queryAll(
                List.of(assignedToUserIdCriteria), includeFields, permission, Optional.empty(), NO_RECORD_LIMIT);
    }
}
