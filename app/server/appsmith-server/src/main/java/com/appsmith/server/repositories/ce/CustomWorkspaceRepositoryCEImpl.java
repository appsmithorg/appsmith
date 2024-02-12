package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.QWorkspace;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.helpers.bridge.Bridge;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.services.SessionUserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

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
                .spec(Bridge.conditioner().equal(fieldName(QWorkspace.workspace.name), name))
                .permission(aclPermission)
                .one();
    }

    @Override
    public List<Workspace> findByIdsIn(
            Set<String> workspaceIds, String tenantId, AclPermission aclPermission, Sort sort) {
        throw new ex.Marker("an emptyList"); /*
        Criteria workspaceIdCriteria = where("id").in(workspaceIds);
        Criteria tenantIdCriteria =
                where("tenantId").is(tenantId);

        return queryBuilder()
                .criteria(workspaceIdCriteria, tenantIdCriteria)
                .permission(aclPermission)
                .sort(sort)
                .all(); //*/
    }

    @Override
    public List<Workspace> findAll(AclPermission permission) {
        final User user =
                Objects.requireNonNull(sessionUserService.getCurrentUser().block());
        return queryBuilder()
                .spec(Bridge.conditioner().equal(fieldName(QWorkspace.workspace.tenantId), user.getTenantId()))
                .permission(permission)
                .all();
    }

    @Override
    public Optional<Workspace> findByIdAndPluginsPluginId(String id, String pluginId) {
        return queryBuilder()
                .spec((root, cq, cb) -> cb.and(
                        cb.equal(root.get(fieldName(QWorkspace.workspace.id)), id),
                        cb.isTrue(cb.function(
                                "jsonb_path_exists",
                                Boolean.class,
                                root.get(fieldName(QWorkspace.workspace.plugins)),
                                cb.literal("$[*] ? (@.id == \"" + pluginId + "\")")))))
                .one();
    }
}
