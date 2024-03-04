package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.services.SessionUserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;

import java.util.List;
import java.util.Objects;
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
        return queryBuilder()
                .criteria(Bridge.equal(Workspace.Fields.name, name))
                .permission(aclPermission)
                .one();
    }

    @Override
    public List<Workspace> findByIdsIn(
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
    public List<Workspace> findAll(AclPermission permission) {
        final User user =
                Objects.requireNonNull(sessionUserService.getCurrentUser().block());
        return queryBuilder()
                .criteria(Bridge.equal(Workspace.Fields.tenantId, user.getTenantId()))
                .permission(permission)
                .all();
    }

    @Override
    public Optional<Workspace> findByIdAndPluginsPluginId(String id, String pluginId) {
        return queryBuilder()
                .criteria((root, cq, cb) -> cb.and(
                        cb.equal(root.get(Workspace.Fields.id), id),
                        cb.isTrue(cb.function(
                                "jsonb_path_exists",
                                Boolean.class,
                                root.get(Workspace.Fields.plugins),
                                cb.literal("$[*] ? (@.pluginId == \"" + pluginId + "\")")))))
                .one();
    }
}
