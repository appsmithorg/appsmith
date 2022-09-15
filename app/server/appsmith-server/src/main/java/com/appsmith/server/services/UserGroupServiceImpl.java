package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.dtos.UserCompactDTO;
import com.appsmith.server.dtos.UserGroupDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.UserGroupRepository;
import org.modelmapper.ModelMapper;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.CREATE_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.DELETE_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.READ_USER_GROUPS;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

@Service
public class UserGroupServiceImpl extends BaseService<UserGroupRepository, UserGroup, String> implements UserGroupService {

    private final SessionUserService sessionUserService;
    private final TenantService tenantService;
    private final PolicyGenerator policyGenerator;
    private final PermissionGroupService permissionGroupService;

    private final UserService userService;

    private final ModelMapper modelMapper;

    public UserGroupServiceImpl(Scheduler scheduler,
                                Validator validator,
                                MongoConverter mongoConverter,
                                ReactiveMongoTemplate reactiveMongoTemplate,
                                UserGroupRepository repository,
                                AnalyticsService analyticsService,
                                SessionUserService sessionUserService,
                                TenantService tenantService,
                                PolicyGenerator policyGenerator,
                                PermissionGroupService permissionGroupService,
                                UserService userService,
                                ModelMapper modelMapper) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.sessionUserService = sessionUserService;
        this.tenantService = tenantService;
        this.policyGenerator = policyGenerator;
        this.permissionGroupService = permissionGroupService;
        this.userService = userService;
        this.modelMapper = modelMapper;
    }

    @Override
    public Flux<UserGroup> get(MultiValueMap<String, String> params) {
        return tenantService.getDefaultTenant()
                .flatMapMany(defaultTenantId -> repository.findAllByTenantId(defaultTenantId.getId(), READ_USER_GROUPS));
    }

    @Override
    public Mono<UserGroup> create(UserGroup userGroup) {
        Mono<Boolean> isCreateAllowedMono = sessionUserService.getCurrentUser()
                .flatMap(user -> tenantService.findById(user.getTenantId(), CREATE_PERMISSION_GROUPS))
                .map(tenant -> TRUE)
                .switchIfEmpty(Mono.just(FALSE));

        Mono<UserGroup> userGroupMono = isCreateAllowedMono
                .flatMap(allowed -> !allowed ?
                        Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "create user groups")) :
                        Mono.just(userGroup)
                );

        return Mono.zip(
                        userGroupMono,
                        tenantService.getDefaultTenant()
                )
                .flatMap(tuple -> {
                    UserGroup userGroupWithPolicy = tuple.getT1();
                    Tenant defaultTenant = tuple.getT2();
                    userGroupWithPolicy.setTenantId(defaultTenant.getId());
                    userGroupWithPolicy = generateAndSetUserGroupPolicies(defaultTenant, userGroupWithPolicy);

                    return super.create(userGroupWithPolicy);
                });
    }

    @Override
    public Mono<UserGroup> update(String id, UserGroup resource) {
        return repository.findById(id, AclPermission.MANAGE_USER_GROUPS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "update user groups")))
                .flatMap(userGroup -> {
                    // The update API should only update the name and description of the group. The fields should not be
                    // updated using this function.
                    userGroup.setName(resource.getName());
                    userGroup.setDescription(resource.getDescription());
                    return super.update(id, userGroup);
                });
    }

    @Override
    public Mono<UserGroup> getById(String id) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<UserGroupDTO> getGroupById(String id) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        return repository.findById(id, READ_USER_GROUPS)
                .flatMap(userGroup -> {

                    Mono<List<PermissionGroupInfoDTO>> groupRolesMono = permissionGroupService.findAllByAssignedToGroupIdsIn(Set.of(id))
                            .map(permissionGroup -> {
                                PermissionGroupInfoDTO permissionGroupDTO = new PermissionGroupInfoDTO();
                                modelMapper.map(permissionGroup, permissionGroupDTO);
                                return permissionGroupDTO;
                            })
                            .collectList();

                    Mono<List<UserCompactDTO>> usersMono = userService.findAllByIdsIn(userGroup.getUsers())
                            .map(user -> {
                                UserCompactDTO userDTO = new UserCompactDTO();
                                modelMapper.map(user, userDTO);
                                return userDTO;
                            })
                            .collectList();

                    return Mono.zip(groupRolesMono, usersMono)
                            .flatMap(tuple -> {
                                UserGroupDTO userGroupDTO = new UserGroupDTO();
                                modelMapper.map(userGroup, userGroupDTO);
                                userGroupDTO.setRoles(tuple.getT1());
                                userGroupDTO.setUsers(tuple.getT2());
                                return Mono.just(userGroupDTO);
                            });
                });
    }

    @Override
    public Mono<UserGroup> archiveById(String id) {
        Mono<UserGroup> userGroupMono = repository.findById(id, DELETE_USER_GROUPS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS)))
                .cache();

        // Find all permission groups that have this user group assigned to it and update them
        Flux<PermissionGroup> updateAllPermissionGroupsFlux = permissionGroupService.findAllByAssignedToGroupIdsIn(Set.of(id))
                .flatMap(permissionGroup -> {
                    Set<String> assignedToGroupIds = permissionGroup.getAssignedToGroupIds();
                    assignedToGroupIds.remove(id);
                    PermissionGroup updates = new PermissionGroup();
                    updates.setAssignedToGroupIds(assignedToGroupIds);
                    return permissionGroupService.update(permissionGroup.getId(), updates);
                });

        Mono<Boolean> archiveGroupAndClearCacheMono = userGroupMono
                .flatMap(userGroup -> {
                    List<String> allUsersAffected = userGroup.getUsers()
                            .stream()
                            .collect(Collectors.toList());

                    // Evict the cache entries for all affected users before archiving
                    return permissionGroupService.cleanPermissionGroupCacheForUsers(allUsersAffected)
                            .then(repository.archiveById(id));
                });

        // First update all the permission groups that have this user group assigned to it
        return updateAllPermissionGroupsFlux
                // then clear cache for all affected users and archive the user group
                .then(archiveGroupAndClearCacheMono)
                // return the deleted group
                .then(userGroupMono);
    }

    private UserGroup generateAndSetUserGroupPolicies(Tenant tenant, UserGroup userGroup) {
        Set<Policy> policies = policyGenerator.getAllChildPolicies(tenant.getPolicies(), Tenant.class, UserGroup.class);
        userGroup.setPolicies(policies);
        return userGroup;
    }

    @Override
    public Mono<UserGroup> findById(String id, AclPermission permission) {
        return repository.findById(id, permission);
    }
}
