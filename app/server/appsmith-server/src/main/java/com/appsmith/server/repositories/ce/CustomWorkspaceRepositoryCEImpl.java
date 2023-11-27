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

import java.util.Collections;
import java.util.List;
import java.util.Optional;
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
    public Optional<Workspace> findByName(String name, AclPermission aclPermission) {
        Criteria nameCriteria = where("name").is(name);

        return queryOne(List.of(nameCriteria), aclPermission);
    }

    @Override
    public List<Workspace> findByIdsIn(
            Set<String> workspaceIds, String tenantId, AclPermission aclPermission, Sort sort) {
        return Collections.emptyList(); /*
        Criteria workspaceIdCriteria = where("id").in(workspaceIds);
        Criteria tenantIdCriteria =
                where("tenantId").is(tenantId);

        return queryAll(List.of(workspaceIdCriteria, tenantIdCriteria), aclPermission, sort);*/
    }

    @Override
    public Optional<Void> updateUserRoleNames(String userId, String userName) {
        return Optional.empty(); /*
        return mongoOperations
                .updateMulti(
                        Query.query(Criteria.where("userRoles.userId").is(userId)),
                        Update.update("userRoles.$.name", userName),
                        Workspace.class)
                .then();*/
    }

    @Override
    public List<Workspace> findAllWorkspaces() {
        return Collections.emptyList(); /*
        return mongoOperations.find(new Query(), Workspace.class);*/
    }

    @Override
    public List<Workspace> findAll(AclPermission permission) {
        return Collections.emptyList(); /*
        return sessionUserService.getCurrentUser().flatMapMany(user -> {
            Criteria tenantIdCriteria =
                    where("tenantId").is(user.getTenantId());
            return queryAll(List.of(tenantIdCriteria), permission);
        });*/
    }
}
