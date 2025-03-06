package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.services.SessionUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Set;

@Slf4j
@RequiredArgsConstructor
public class CustomWorkspaceRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Workspace>
        implements CustomWorkspaceRepositoryCE {

    private final SessionUserService sessionUserService;

    @Override
    public Mono<Workspace> findByName(String name, AclPermission aclPermission) {
        return queryBuilder()
                .criteria(Bridge.equal(Workspace.Fields.name, name))
                .permission(aclPermission)
                .one();
    }

    @Override
    public Flux<Workspace> findByIdsIn(
            Set<String> workspaceIds, String organizationId, AclPermission aclPermission, Sort sort) {
        return queryBuilder()
                .criteria(Bridge.<Workspace>in(Workspace.Fields.id, workspaceIds)
                        .equal(Workspace.Fields.organizationId, organizationId))
                .permission(aclPermission)
                .sort(sort)
                .all();
    }

    @Override
    public Flux<Workspace> findAll(AclPermission permission) {
        return sessionUserService.getCurrentUser().flatMapMany(user -> queryBuilder()
                .criteria(Bridge.equal(Workspace.Fields.organizationId, user.getOrganizationId()))
                .permission(permission)
                .all());
    }
}
