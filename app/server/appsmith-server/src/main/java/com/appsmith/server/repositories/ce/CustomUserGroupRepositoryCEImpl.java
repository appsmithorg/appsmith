package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.QBaseDomain;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.QUserGroup;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;

import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;

import static org.springframework.data.mongodb.core.query.Criteria.where;

public class CustomUserGroupRepositoryCEImpl extends BaseAppsmithRepositoryImpl<UserGroup>
        implements CustomUserGroupRepositoryCE {

    public CustomUserGroupRepositoryCEImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }

    @Override
    public Flux<UserGroup> findAllByIds(Set<String> ids, AclPermission permission) {
        Criteria emailCriteria = where(fieldName(QBaseDomain.baseDomain.id)).in(ids);
        return queryAll(List.of(emailCriteria), permission);
    }

    @Override
    public Flux<UserGroup> findAllByUserId(String userId, AclPermission permission) {
        Criteria userIdCriteria = where(fieldName(QUserGroup.userGroup.users)).elemMatch(where("id").is(userId));
        return queryAll(List.of(userIdCriteria), permission);
    }

    @Override
    public Flux<UserGroup> findAllByUserIdAndDefaultWorkspaceId(String userId, String defaultWorkspaceId,
            AclPermission permission) {
        Criteria userIdCriteria = where(fieldName(QUserGroup.userGroup.users)).elemMatch(where("id").is(userId));
        Criteria defaultWorkspaceIdCriteria = where(fieldName(QUserGroup.userGroup.defaultWorkspaceId)).is(defaultWorkspaceId);
        return queryAll(List.of(userIdCriteria, defaultWorkspaceIdCriteria), permission);
    }

    @Override
    public Mono<UserGroup> findByIdAndDefaultWorkspaceId(String id, String defaultWorkspaceId,
            AclPermission permission) {
        Criteria idCriteria = where(fieldName(QBaseDomain.baseDomain.id)).is(id);
        Criteria defaultWorkspaceIdCriteria = where(fieldName(QUserGroup.userGroup.defaultWorkspaceId)).is(defaultWorkspaceId);
        return queryOne(List.of(idCriteria, defaultWorkspaceIdCriteria), permission);
    }
}
