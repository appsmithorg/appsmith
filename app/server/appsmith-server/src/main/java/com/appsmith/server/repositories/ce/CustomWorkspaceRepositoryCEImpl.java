package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.services.SessionUserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Slf4j
public class CustomWorkspaceRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Workspace>
        implements CustomWorkspaceRepositoryCE {

    private final SessionUserService sessionUserService;

    public CustomWorkspaceRepositoryCEImpl(
            SessionUserService sessionUserService, CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(cacheableRepositoryHelper);
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
        return queryBuilder()
                .criteria(Bridge.<Workspace>in(Workspace.Fields.id, workspaceIds)
                        .equal(Workspace.Fields.tenantId, tenantId))
                .permission(aclPermission)
                .sort(sort)
                .all();
    }

    @Override
    public List<Workspace> findAll(AclPermission permission) {
        return sessionUserService.getCurrentUser().flatMapMany(user -> Flux.fromIterable(queryBuilder()
                .criteria(Bridge.equal(Workspace.Fields.tenantId, user.getTenantId()))
                .permission(permission)
                .all())).collectList().block();
    }
}
