package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.services.SessionUserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Set;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
public class CustomWorkspaceRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Workspace>
        implements CustomWorkspaceRepositoryCE {

    private final SessionUserService sessionUserService;

    public CustomWorkspaceRepositoryCEImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            SessionUserService sessionUserService,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
        this.sessionUserService = sessionUserService;
    }

    @Override
    public Mono<Workspace> findByName(String name, AclPermission aclPermission) {
        Criteria nameCriteria = where(Workspace.Fields.name).is(name);

        return queryBuilder().criteria(nameCriteria).permission(aclPermission).one();
    }

    @Override
    public Flux<Workspace> findByIdsIn(
            Set<String> workspaceIds, String tenantId, AclPermission aclPermission, Sort sort) {
        Criteria workspaceIdCriteria = where(Workspace.Fields.id).in(workspaceIds);
        Criteria tenantIdCriteria = where(Workspace.Fields.tenantId).is(tenantId);

        return queryBuilder()
                .criteria(workspaceIdCriteria, tenantIdCriteria)
                .permission(aclPermission)
                .sort(sort)
                .all();
    }

    @Override
    public Flux<Workspace> findAllWorkspaces() {
        return queryBuilder().all();
    }

    @Override
    public Flux<Workspace> findAll(AclPermission permission) {
        return sessionUserService.getCurrentUser().flatMapMany(user -> {
            Criteria tenantIdCriteria = where(Workspace.Fields.tenantId).is(user.getTenantId());
            return queryBuilder()
                    .criteria(tenantIdCriteria)
                    .permission(permission)
                    .all();
        });
    }
}
