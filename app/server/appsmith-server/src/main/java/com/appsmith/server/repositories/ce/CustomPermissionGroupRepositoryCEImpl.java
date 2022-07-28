package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.QPermissionGroup;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;

import reactor.core.publisher.Flux;

import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;

import static org.springframework.data.mongodb.core.query.Criteria.where;

import java.util.List;

public class CustomPermissionGroupRepositoryCEImpl extends BaseAppsmithRepositoryImpl<PermissionGroup>
        implements CustomPermissionGroupRepositoryCE {

    public CustomPermissionGroupRepositoryCEImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }

    @Override
    public Flux<PermissionGroup> findAllByAssignedToUserIdAndDefaultWorkspaceId(String userId, String workspaceId,
            AclPermission permission) {
        Criteria assignedToUserIdCriteria = where(fieldName(QPermissionGroup.permissionGroup.assignedToUserIds)).in(userId);
        Criteria defaultWorkspaceIdCriteria = where(fieldName(QPermissionGroup.permissionGroup.defaultWorkspaceId)).is(workspaceId);
        return queryAll(List.of(assignedToUserIdCriteria, defaultWorkspaceIdCriteria), permission);
    }

    @Override
    public Flux<PermissionGroup> findByDefaultWorkspaceId(String workspaceId, AclPermission permission) {
        Criteria defaultWorkspaceIdCriteria = where(fieldName(QPermissionGroup.permissionGroup.defaultWorkspaceId)).is(workspaceId);
        return queryAll(List.of(defaultWorkspaceIdCriteria), permission);
    }
}
