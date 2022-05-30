package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.domains.QWorkspace;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
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

@Slf4j
public class CustomWorkspaceRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Workspace>
        implements CustomWorkspaceRepositoryCE {

    public CustomWorkspaceRepositoryCEImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }

    @Override
    public Mono<Workspace> findByName(String name, AclPermission aclPermission) {
        Criteria nameCriteria = where(fieldName(QWorkspace.workspace.name)).is(name);

        return queryOne(List.of(nameCriteria), aclPermission);
    }

    @Override
    public Flux<Workspace> findByIdsIn(Set<String> orgIds, String tenantId, AclPermission aclPermission, Sort sort) {
        Criteria orgIdsCriteria = where(fieldName(QWorkspace.workspace.id)).in(orgIds);
        Criteria tenantIdCriteria = where(fieldName(QWorkspace.workspace.tenantId)).is(tenantId);

        return queryAll(List.of(orgIdsCriteria, tenantIdCriteria), aclPermission, sort);
    }

    @Override
    public Mono<Void> updateUserRoleNames(String userId, String userName) {
        return mongoOperations
                .updateMulti(
                        Query.query(Criteria.where("userRoles.userId").is(userId)),
                        Update.update("userRoles.$.name", userName),
                        Workspace.class
                )
                .then();
    }

    @Override
    public Flux<Workspace> findAllWorkspaces() {
        return mongoOperations.find(new Query(), Workspace.class);
    }
}
