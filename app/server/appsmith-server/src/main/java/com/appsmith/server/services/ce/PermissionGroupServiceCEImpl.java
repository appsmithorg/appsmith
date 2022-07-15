package com.appsmith.server.services.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import com.appsmith.server.services.SessionUserService;

import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;

import java.util.List;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;


public class PermissionGroupServiceCEImpl extends BaseService<PermissionGroupRepository, PermissionGroup, String>
        implements PermissionGroupServiceCE {

    private final SessionUserService sessionUserService;

    public PermissionGroupServiceCEImpl(Scheduler scheduler,
                                        Validator validator,
                                        MongoConverter mongoConverter,
                                        ReactiveMongoTemplate reactiveMongoTemplate,
                                        PermissionGroupRepository repository,
                                        AnalyticsService analyticsService,
                                        SessionUserService sessionUserService) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.sessionUserService = sessionUserService;
    }

    @Override
    public Flux<PermissionGroup> findAllByIds(Set<String> ids) {
        return repository.findAllById(ids);
    }

    @Override
    public Mono<PermissionGroup> save(PermissionGroup permissionGroup) {
        return repository.save(permissionGroup);
    }

    @Override
    public Mono<PermissionGroup> getById(String id, AclPermission permission) {
        return repository.findById(id, permission);
    }
    
    public Mono<Void> delete(String id) {
        return repository.deleteById(id);
    }

    @Override
    public Mono<PermissionGroup> findById(String permissionGroupId) {
        return repository.findById(permissionGroupId);
    }

    public Mono<PermissionGroup> assignToUser(PermissionGroup permissionGroup, User user) {
        return bulkAssignToUsers(permissionGroup, List.of(user));
    }

    private void ensureAssignedToUserIds(PermissionGroup permissionGroup) {
        if (permissionGroup.getAssignedToUserIds() == null) {
            permissionGroup.setAssignedToUserIds(new HashSet<>());
        }
    }

    @Override
    public Mono<PermissionGroup> bulkAssignToUsers(PermissionGroup permissionGroup, List<User> users) {
        return repository.findById(permissionGroup.getId(), AclPermission.ASSIGN_PERMISSION_GROUPS)
                .flatMap(pg -> {
                    ensureAssignedToUserIds(pg);
                    pg.getAssignedToUserIds().addAll(users.stream().map(User::getId).collect(Collectors.toList()));
                    return repository.updateById(pg.getId(), pg, AclPermission.ASSIGN_PERMISSION_GROUPS);
                })
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND)));
    }

    @Override
    public Mono<PermissionGroup> unassignFromSelf(PermissionGroup permissionGroup) {
        return sessionUserService.getCurrentUser()
                .flatMap(user -> {
                    ensureAssignedToUserIds(permissionGroup);
                    permissionGroup.getAssignedToUserIds().remove(user.getId());
                    return repository.updateById(permissionGroup.getId(), permissionGroup, AclPermission.READ_PERMISSION_GROUPS);
                });
    }

    @Override
    public Flux<PermissionGroup> getByDefaultWorkspace(Workspace workspace) {
        return repository.findByDefaultWorkspaceId(workspace.getId());
    }

    @Override
    public Flux<PermissionGroup> getAllByAssignedToUserAndDefaultWorkspace(User user, Workspace defaultWorkspace, AclPermission permission) {
        return repository.findAllByAssignedToUserIdAndDefaultWorkspaceId(user.getId(), defaultWorkspace.getId(), permission);
    }

    @Override
    public Mono<PermissionGroup> unassignFromUser(PermissionGroup permissionGroup, User user) {
        return repository.findById(permissionGroup.getId(), AclPermission.MANAGE_PERMISSION_GROUPS)
                .flatMap(pg -> {
                    ensureAssignedToUserIds(pg);
                    pg.getAssignedToUserIds().remove(user.getId());
                    return repository.updateById(pg.getId(), pg, AclPermission.MANAGE_PERMISSION_GROUPS);
                });
    }
}
