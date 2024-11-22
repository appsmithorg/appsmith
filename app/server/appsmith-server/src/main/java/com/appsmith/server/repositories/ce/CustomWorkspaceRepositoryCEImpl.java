package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.services.SessionUserService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Slf4j
@RequiredArgsConstructor
public class CustomWorkspaceRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Workspace>
        implements CustomWorkspaceRepositoryCE {

    private final SessionUserService sessionUserService;

    @Override
    public Optional<Workspace> findByName(
            String name, AclPermission permission, User currentUser, EntityManager entityManager) {
        return queryBuilder()
                .criteria(Bridge.equal(Workspace.Fields.name, name))
                .permission(permission, currentUser)
                .entityManager(entityManager)
                .one();
    }

    @Override
    public List<Workspace> findByIdsIn(
            Set<String> workspaceIds,
            String tenantId,
            AclPermission permission,
            User currentUser,
            Sort sort,
            EntityManager entityManager) {
        return queryBuilder()
                .criteria(Bridge.<Workspace>in(Workspace.Fields.id, workspaceIds)
                        .equal(Workspace.Fields.tenantId, tenantId))
                .permission(permission, currentUser)
                .sort(sort)
                .entityManager(entityManager)
                .all();
    }

    @Override
    public List<Workspace> findAll(AclPermission permission, User currentUser, EntityManager entityManager) {
        return Flux.fromIterable(queryBuilder()
                        .criteria(Bridge.equal(Workspace.Fields.tenantId, currentUser.getTenantId()))
                        .sort(Sort.by(Sort.Order.asc(Workspace.Fields.createdAt))) // Sort by name by createdAt
                        .permission(permission, currentUser)
                        .entityManager(entityManager)
                        .all())
                .collectList()
                .block();
    }
}
