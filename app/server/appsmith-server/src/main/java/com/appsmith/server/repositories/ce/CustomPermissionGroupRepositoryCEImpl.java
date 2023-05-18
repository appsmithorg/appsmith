package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.QPermissionGroup;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.mongodb.client.result.UpdateResult;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;

import static org.springframework.data.mongodb.core.query.Criteria.where;

public class CustomPermissionGroupRepositoryCEImpl extends BaseAppsmithRepositoryImpl<PermissionGroup>
        implements CustomPermissionGroupRepositoryCE {

    public CustomPermissionGroupRepositoryCEImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter, CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Flux<PermissionGroup> findAllByAssignedToUserIdAndDefaultWorkspaceId(String userId, String workspaceId,
            AclPermission permission) {
        Criteria assignedToUserIdCriteria = where(fieldName(QPermissionGroup.permissionGroup.assignedToUserIds)).in(userId);
        Criteria defaultWorkspaceIdCriteria = where(fieldName(QPermissionGroup.permissionGroup.defaultDomainId)).is(workspaceId);
        Criteria defaultDomainTypeCriteria = where(fieldName(QPermissionGroup.permissionGroup.defaultDomainType)).is(Workspace.class.getSimpleName());
        return queryAll(List.of(assignedToUserIdCriteria, defaultWorkspaceIdCriteria, defaultDomainTypeCriteria), permission);
    }

    @Override
    public Mono<UpdateResult> updateById(String id, Update updateObj) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }
        Query query = new Query(Criteria.where("id").is(id));
        return mongoOperations.updateFirst(query, updateObj, this.genericDomain);
    }

    @Override
    public Flux<PermissionGroup> findByDefaultWorkspaceId(String workspaceId, AclPermission permission) {
        Criteria defaultWorkspaceIdCriteria = where(fieldName(QPermissionGroup.permissionGroup.defaultDomainId)).is(workspaceId);
        Criteria defaultDomainTypeCriteria = where(fieldName(QPermissionGroup.permissionGroup.defaultDomainType)).is(Workspace.class.getSimpleName());
        return queryAll(List.of(defaultWorkspaceIdCriteria, defaultDomainTypeCriteria), permission);
    }

    @Override
    public Flux<PermissionGroup> findByDefaultWorkspaceIds(Set<String> workspaceIds, AclPermission permission) {
        Criteria defaultWorkspaceIdCriteria = where(fieldName(QPermissionGroup.permissionGroup.defaultDomainId)).in(workspaceIds);
        Criteria defaultDomainTypeCriteria = where(fieldName(QPermissionGroup.permissionGroup.defaultDomainType)).is(Workspace.class.getSimpleName());
        return queryAll(List.of(defaultWorkspaceIdCriteria, defaultDomainTypeCriteria), permission);
    }

    @Override
    public Mono<Void> evictPermissionGroupsUser(String email, String tenantId) {
        return cacheableRepositoryHelper.evictPermissionGroupsUser(email, tenantId);
    }

    @Override
    public Mono<Void> evictAllPermissionGroupCachesForUser(String email, String tenantId) {
        return this.evictPermissionGroupsUser(email, tenantId);
    }
}
