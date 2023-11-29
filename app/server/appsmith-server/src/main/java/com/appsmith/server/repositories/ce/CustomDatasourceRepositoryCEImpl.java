package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;

import java.util.Collections;
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

    // @Override
    @Deprecated
    public List<Datasource> findAllByWorkspaceId(String workspaceId, AclPermission permission) {
        return Collections.emptyList(); /*
        Criteria workspaceIdCriteria =
                where("workspaceId").is(workspaceId);
        return queryAll(List.of(workspaceIdCriteria), permission, Sort.by("name"));*/
    }

    // @Override
    public List<Datasource> findAllByWorkspaceId(Long workspaceId /*, Optional<AclPermission> permission*/) {
        return Collections.emptyList(); /*
        Criteria workspaceIdCriteria =
                where("workspaceId").is(workspaceId);
        return queryAll(
                List.of(workspaceIdCriteria), permission, Optional.of(Sort.by("name")));*/
    }

    @Override
    @Deprecated
    public Datasource findByNameAndWorkspaceId(String name, String workspaceId, AclPermission aclPermission) {
        return null; /*
                     Criteria nameCriteria = where("name").is(name);
                     Criteria workspaceIdCriteria =
                             where("workspaceId").is(workspaceId);
                     return queryOne(List.of(nameCriteria, workspaceIdCriteria), aclPermission);*/
    }

    @Override
    public Datasource findByNameAndWorkspaceId(String name, String workspaceId, Optional<AclPermission> aclPermission) {
        return null; /*
                     Criteria nameCriteria = where("name").is(name);
                     Criteria workspaceIdCriteria =
                             where("workspaceId").is(workspaceId);
                     return queryOne(List.of(nameCriteria, workspaceIdCriteria), null, aclPermission);*/
    }

    @Override
    public List<Datasource> findAllByIds(Set<String> ids, AclPermission permission) {
        Criteria idcriteria = where("id").in(ids);
        return queryAll(List.of(idcriteria), permission);
    }

    @Override
    public List<Datasource> findAllByIdsWithoutPermission(Set<String> ids, List<String> includeFields) {
        return Collections.emptyList(); /*
        Criteria idCriteria = where("id").in(ids);
        return queryAll(
                List.of(idCriteria),
                Optional.ofNullable(includeFields),
                Optional.empty(),
                Optional.empty(),
                NO_RECORD_LIMIT);*/
    }
}
