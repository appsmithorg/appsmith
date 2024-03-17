package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.springframework.data.mongodb.core.query.Criteria.where;

public class CustomDatasourceRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Datasource>
        implements CustomDatasourceRepositoryCE {

    public CustomDatasourceRepositoryCEImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    @Deprecated
    public Flux<Datasource> findAllByWorkspaceId(String workspaceId, AclPermission permission) {
        Criteria workspaceIdCriteria = where(Datasource.Fields.workspaceId).is(workspaceId);
        Sort sort = Sort.by(Datasource.Fields.name);
        return queryBuilder()
                .criteria(workspaceIdCriteria)
                .permission(permission)
                .sort(sort)
                .all();
    }

    @Override
    public Flux<Datasource> findAllByWorkspaceId(String workspaceId, Optional<AclPermission> permission) {
        Criteria workspaceIdCriteria = where(Datasource.Fields.workspaceId).is(workspaceId);
        return queryBuilder()
                .criteria(workspaceIdCriteria)
                .permission(permission.orElse(null))
                .sort(Sort.by(Datasource.Fields.name))
                .all();
    }

    @Override
    @Deprecated
    public Mono<Datasource> findByNameAndWorkspaceId(String name, String workspaceId, AclPermission aclPermission) {
        Criteria nameCriteria = where(Datasource.Fields.name).is(name);
        Criteria workspaceIdCriteria = where(Datasource.Fields.workspaceId).is(workspaceId);
        return queryBuilder()
                .criteria(nameCriteria, workspaceIdCriteria)
                .permission(aclPermission)
                .one();
    }

    @Override
    public Mono<Datasource> findByNameAndWorkspaceId(
            String name, String workspaceId, Optional<AclPermission> aclPermission) {
        Criteria nameCriteria = where(Datasource.Fields.name).is(name);
        Criteria workspaceIdCriteria = where(Datasource.Fields.workspaceId).is(workspaceId);
        return queryBuilder()
                .criteria(nameCriteria, workspaceIdCriteria)
                .permission(aclPermission.orElse(null))
                .one();
    }

    @Override
    public Flux<Datasource> findAllByIds(Set<String> ids, AclPermission permission) {
        Criteria idcriteria = where(Datasource.Fields.id).in(ids);
        return queryBuilder().criteria(idcriteria).permission(permission).all();
    }

    @Override
    public Flux<Datasource> findAllByIdsWithoutPermission(Set<String> ids, List<String> includeFields) {
        Criteria idCriteria = where(Datasource.Fields.id).in(ids);
        return queryBuilder().criteria(idCriteria).fields(includeFields).all();
    }
}
