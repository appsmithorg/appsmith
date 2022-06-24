package com.appsmith.server.services.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.domains.UserInGroup;
import com.appsmith.server.repositories.UserGroupRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import java.util.List;
import java.util.stream.Collectors;

import javax.validation.Validator;
import java.util.Set;

public class UserGroupServiceCEImpl extends BaseService<UserGroupRepository, UserGroup, String> implements UserGroupServiceCE{

    public UserGroupServiceCEImpl(Scheduler scheduler,
                                  Validator validator,
                                  MongoConverter mongoConverter,
                                  ReactiveMongoTemplate reactiveMongoTemplate,
                                  UserGroupRepository repository,
                                  AnalyticsService analyticsService) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
    }

    @Override
    public Flux<UserGroup> findAllByIds(Set<String> ids) {
        return repository.findAllById(ids);
    }

    @Override
    public Mono<UserGroup> save(UserGroup userGroup) {
        return repository.save(userGroup);
    }
  
    @Override
    public Mono<UserGroup> getById(String id, AclPermission permission) {
        return repository.findById(id, permission);
    }

    @Override
    public Mono<UserGroup> bulkAddUsers(UserGroup userGroup, List<User> users) {
        userGroup.getUsers().addAll(users.stream().map(user -> new UserInGroup(user)).collect(Collectors.toList()));
        return repository.updateById(userGroup.getId(), userGroup, AclPermission.INVITE_USER_GROUPS);
    }

    @Override
    public Flux<UserGroup> getDefaultUserGroups(String workspaceId) {
        return repository.findByDefaultWorkspaceId(workspaceId);
    }

    @Override
    public Flux<UserGroup> getAllByIds(Set<String> ids, AclPermission permission) {
        return repository.findAllByIds(ids, permission);
    }

    @Override
    public Flux<UserGroup> getAllByUserId(String userId, AclPermission permission) {
        return repository.findAllByUserId(userId, permission);
    }

    @Override
    public Mono<UserGroup> addUser(UserGroup userGroup, User user) {
        return bulkAddUsers(userGroup, List.of(user));
    }

    private Mono<UserGroup> removeUserAsPermission(UserGroup userGroup, User user, AclPermission permission) {
        boolean removed = userGroup.getUsers().remove(new UserInGroup(user));
        if (removed) {
            return repository.updateById(userGroup.getId(), userGroup, permission);
        }
        return Mono.just(userGroup);
    }

    @Override
    public Mono<UserGroup> removeUser(UserGroup userGroup, User user) {
        return removeUserAsPermission(userGroup, user, AclPermission.MANAGE_USER_GROUPS);
    }

    @Override
    public Mono<UserGroup> removeSelf(UserGroup userGroup) {
        Mono<User> userMono = ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> (User) auth.getPrincipal());
        return userMono.flatMap(user -> removeUserAsPermission(userGroup, user, AclPermission.READ_USER_GROUPS));
    }

    @Override
    public Flux<UserGroup> getAllByUserIdAndDefaultWorkspaceId(String userId, String defaultWorkspaceId,
            AclPermission permission) {
        return repository.findAllByUserIdAndDefaultWorkspaceId(userId, defaultWorkspaceId, permission);
    }

    @Override
    public Mono<UserGroup> getByIdAndDefaultWorkspaceId(String id, String defaultWorkspaceId,
            AclPermission permission) {
        return repository.findByIdAndDefaultWorkspaceId(id, defaultWorkspaceId, permission);
    }
}
