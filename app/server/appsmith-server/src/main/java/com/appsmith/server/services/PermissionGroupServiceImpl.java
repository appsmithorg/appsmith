package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.dtos.PermissionGroupCompactDTO;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.dtos.UpdateRoleAssociationDTO;
import com.appsmith.server.dtos.UserCompactDTO;
import com.appsmith.server.dtos.UserGroupCompactDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.repositories.ConfigRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ce.PermissionGroupServiceCEImpl;
import com.appsmith.server.solutions.roles.RoleConfigurationSolution;
import com.appsmith.server.solutions.roles.dtos.RoleViewDTO;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.ASSIGN_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.CREATE_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.DELETE_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.MANAGE_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.READ_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.UNASSIGN_PERMISSION_GROUPS;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

@Service
@Slf4j
public class PermissionGroupServiceImpl extends PermissionGroupServiceCEImpl implements PermissionGroupService {

    private final ModelMapper modelMapper;
    private final SessionUserService sessionUserService;
    private final TenantService tenantService;
    private final PolicyGenerator policyGenerator;

    private final UserRepository userRepository;

    private final UserGroupRepository userGroupRepository;

    private final RoleConfigurationSolution roleConfigurationSolution;

    public PermissionGroupServiceImpl(Scheduler scheduler,
                                      Validator validator,
                                      MongoConverter mongoConverter,
                                      ReactiveMongoTemplate reactiveMongoTemplate,
                                      PermissionGroupRepository repository,
                                      AnalyticsService analyticsService,
                                      SessionUserService sessionUserService,
                                      TenantService tenantService,
                                      UserRepository userRepository,
                                      PolicyUtils policyUtils,
                                      ConfigRepository configRepository,
                                      ModelMapper modelMapper,
                                      PolicyGenerator policyGenerator,
                                      UserGroupRepository userGroupRepository,
                                      RoleConfigurationSolution roleConfigurationSolution) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService,
                sessionUserService, tenantService, userRepository, policyUtils, configRepository);
        this.modelMapper = modelMapper;
        this.policyGenerator = policyGenerator;
        this.sessionUserService = sessionUserService;
        this.tenantService = tenantService;
        this.userGroupRepository = userGroupRepository;
        this.roleConfigurationSolution = roleConfigurationSolution;
        this.userRepository = userRepository;
    }

    @Override
    public Mono<List<PermissionGroupInfoDTO>> getAll() {
        return repository.findAll(READ_PERMISSION_GROUPS)
                .map(permissionGroup -> modelMapper.map(permissionGroup, PermissionGroupInfoDTO.class))
                .collectList();
    }

    @Override
    public Mono<List<PermissionGroupInfoDTO>> getAllAssignableRoles() {
        return repository.findAll(ASSIGN_PERMISSION_GROUPS)
                .map(permissionGroup -> modelMapper.map(permissionGroup, PermissionGroupInfoDTO.class))
                .collectList();
    }

    @Override
    public Mono<PermissionGroup> findById(String id, AclPermission permission) {
        return repository.findById(id, permission);
    }

    @Override
    public Flux<PermissionGroup> findAllByAssignedToGroupIdsIn(Set<String> groupIds) {
        return repository.findAllByAssignedToGroupIdsIn(groupIds);
    }

    @Override
    public Flux<PermissionGroup> findAllByAssignedToUsersIn(Set<String> userIds) {
        return repository.findAllByAssignedToUserIdsIn(userIds);
    }

    @Override
    public Mono<PermissionGroup> create(PermissionGroup permissionGroup) {
        Mono<Boolean> isCreateAllowedMono = Mono.zip(sessionUserService.getCurrentUser(), tenantService.getDefaultTenantId())
                .flatMap(tuple -> {
                    User user = tuple.getT1();
                    String defaultTenantId = tuple.getT2();

                    if (user.getTenantId() != null) {
                        defaultTenantId = user.getTenantId();
                    }

                    return tenantService.findById(defaultTenantId, CREATE_PERMISSION_GROUPS);
                })
                .map(tenant -> TRUE)
                .switchIfEmpty(Mono.just(FALSE));

        if (permissionGroup.getId() != null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        Mono<PermissionGroup> userPermissionGroupMono = isCreateAllowedMono
                .flatMap(isCreateAllowed -> {
                    if (!isCreateAllowed && permissionGroup.getDefaultWorkspaceId() == null) {
                        // Throw an error if the user is not allowed to create a permission group. If default workspace id
                        // is set, this permission group is system generated and hence shouldn't error out.
                        return Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "Create Role"));
                    }

                    return Mono.just(permissionGroup);
                });

        return Mono.zip(
                        userPermissionGroupMono,
                        tenantService.getDefaultTenant()
                )
                .flatMap(tuple -> {
                    PermissionGroup userPermissionGroup = tuple.getT1();
                    Tenant defaultTenant = tuple.getT2();
                    userPermissionGroup.setTenantId(defaultTenant.getId());

                    userPermissionGroup = generateAndSetPermissionGroupPolicies(defaultTenant, userPermissionGroup);

                    return super.create(userPermissionGroup);
                })
                // make the default workspace roles uneditable
                .flatMap(permissionGroup1 -> {
                    // If default workspace id is set, it's a default workspace role and hence shouldn't be editable or deletable
                    if (permissionGroup1.getDefaultWorkspaceId() != null) {
                        Set<Policy> policiesWithoutEditPermission = permissionGroup1.getPolicies().stream()
                                .filter(policy ->
                                        !policy.getPermission().equals(MANAGE_PERMISSION_GROUPS.getValue())
                                                &&
                                                !policy.getPermission().equals(DELETE_PERMISSION_GROUPS.getValue())
                                )
                                .collect(Collectors.toSet());
                        permissionGroup1.setPolicies(policiesWithoutEditPermission);
                        return repository.save(permissionGroup1);
                    }
                    // If this is not a default created role, then return the role as is from the DB
                    return repository.findById(permissionGroup1.getId(), READ_PERMISSION_GROUPS);
                });
    }

    private PermissionGroup generateAndSetPermissionGroupPolicies(Tenant tenant, PermissionGroup permissionGroup) {
        Set<Policy> policies = policyGenerator.getAllChildPolicies(tenant.getPolicies(), Tenant.class, PermissionGroup.class);
        permissionGroup.setPolicies(policies);
        return permissionGroup;
    }

    @Override
    public Mono<PermissionGroup> archiveById(String id) {
        Mono<PermissionGroup> permissionGroupMono = repository.findById(id, DELETE_PERMISSION_GROUPS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS)))
                .cache();

        return permissionGroupMono
                .flatMap(permissionGroup -> {
                    Set<String> assignedToUserIds = permissionGroup.getAssignedToUserIds();
                    Set<String> assignedToGroupIds = permissionGroup.getAssignedToGroupIds();

                    List<String> allUsersAffected = new ArrayList<>();
                    allUsersAffected.addAll(assignedToUserIds);
                    // TODO : handle for groups by adding all the users from the groups to allUsersAffected

                    // Evict the cache entries for all affected users before archiving
                    return cleanPermissionGroupCacheForUsers(allUsersAffected)
                            .then(repository.archiveById(id));
                })
                .then(permissionGroupMono);
    }

    @Override
    public Mono<PermissionGroup> bulkUnassignFromUserGroups(PermissionGroup permissionGroup, Set<UserGroup> userGroups) {
        ensureAssignedToUserGroups(permissionGroup);

        // Get the userIds from all the user groups that we are unassigning
        List<String> userIds = userGroups.stream()
                .map(ug -> ug.getUsers())
                .flatMap(Collection::stream)
                .collect(Collectors.toList());

        // Remove the user groups from the permission group
        permissionGroup.getAssignedToGroupIds().removeAll(userGroups);

        return Mono.zip(
                        repository.updateById(permissionGroup.getId(), permissionGroup, AclPermission.UNASSIGN_PERMISSION_GROUPS),
                        cleanPermissionGroupCacheForUsers(userIds).thenReturn(TRUE)
                )
                .map(tuple -> tuple.getT1());
    }

    @Override
    public Mono<RoleViewDTO> findConfigurableRoleById(String id) {
        // The user should have atleast READ_PERMISSION_GROUPS permission to view the role. The edits would be allowed via
        // MANAGE_PERMISSION_GROUPS permission.
        return repository.findById(id, READ_PERMISSION_GROUPS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS)))
                .flatMap(permissionGroup -> roleConfigurationSolution.getAllTabViews(permissionGroup.getId())
                        .map(roleViewDTO -> {
                            roleViewDTO.setId(permissionGroup.getId());
                            roleViewDTO.setName(permissionGroup.getName());
                            roleViewDTO.setUserPermissions(permissionGroup.getUserPermissions());
                            return roleViewDTO;
                        }));
    }

    @Override
    public Mono<Boolean> changeRoleAssociations(UpdateRoleAssociationDTO updateRoleAssociationDTO) {
        Set<UserCompactDTO> userDTOs = updateRoleAssociationDTO.getUsers();
        Set<UserGroupCompactDTO> groupDTOs = updateRoleAssociationDTO.getGroups();
        Set<PermissionGroupCompactDTO> rolesAddedDTOs = updateRoleAssociationDTO.getRolesAdded();
        Set<PermissionGroupCompactDTO> rolesRemovedDTOs = updateRoleAssociationDTO.getRolesRemoved();

        Flux<User> userFlux = Flux.empty();
        Flux<UserGroup> groupFlux = Flux.empty();
        Flux<PermissionGroup> rolesAddedFlux = Flux.empty();
        Flux<PermissionGroup> rolesRemovedFlux = Flux.empty();

        if (!CollectionUtils.isEmpty(userDTOs)) {
            userFlux = userRepository.findAllById(userDTOs.stream().map(UserCompactDTO::getId).collect(Collectors.toSet()))
                    .cache();
        }
        if (!CollectionUtils.isEmpty(groupDTOs)) {
            groupFlux = userGroupRepository.findAllById(groupDTOs.stream().map(UserGroupCompactDTO::getId).collect(Collectors.toSet()))
                    .cache();
        }
        if (!CollectionUtils.isEmpty(rolesAddedDTOs)) {
            rolesAddedFlux = repository.findAllById(rolesAddedDTOs.stream().map(PermissionGroupCompactDTO::getId).collect(Collectors.toSet()),
                            ASSIGN_PERMISSION_GROUPS);
        }
        if (!CollectionUtils.isEmpty(rolesRemovedDTOs)) {
            rolesRemovedFlux = repository.findAllById(rolesRemovedDTOs.stream().map(PermissionGroupCompactDTO::getId).collect(Collectors.toSet()),
                            UNASSIGN_PERMISSION_GROUPS);
        }

        // Bulk assign to roles added
        Flux<PermissionGroup> bulkAssignToRolesMono = Flux.zip(rolesAddedFlux, userFlux.collectList().repeat(), groupFlux.collectList().repeat())
                .flatMap(tuple -> {
                    PermissionGroup permissionGroup = tuple.getT1();
                    List<User> users = tuple.getT2();
                    List<UserGroup> groups = tuple.getT3();
                    return bulkAssignToUsersAndGroups(permissionGroup, users, groups);
                });

        // Bulk unassign from roles removed
        Flux<PermissionGroup> bulkUnassignFromRolesMono = Flux.zip(rolesRemovedFlux, userFlux.collectList().repeat(), groupFlux.collectList().repeat())
                .flatMap(tuple -> {
                    PermissionGroup permissionGroup = tuple.getT1();
                    List<User> users = tuple.getT2();
                    List<UserGroup> groups = tuple.getT3();
                    return bulkUnassignFromUsersAndGroups(permissionGroup, users, groups);
                });

        // Clear cache for all the affected users
        Mono<Void> cleanCacheForUsersMono = Mono.zip(userFlux.collectList(), groupFlux.collectList())
                .flatMap(tuple -> {
                    List<User> users = tuple.getT1();
                    List<UserGroup> groups = tuple.getT2();
                    List<String> userIds = users.stream().map(User::getId).collect(Collectors.toList());
                    // Get the userIds from all the user groups that we are unassigning
                    List<String> usersInGroups = groups.stream()
                            .map(ug -> ug.getUsers())
                            .flatMap(Collection::stream)
                            .collect(Collectors.toList());
                    userIds.addAll(usersInGroups);
                    return cleanPermissionGroupCacheForUsers(userIds);
                });

        return Mono.when(bulkAssignToRolesMono.collectList(), bulkUnassignFromRolesMono.collectList())
                .then(cleanCacheForUsersMono)
                .thenReturn(TRUE);

    }

    private Mono<PermissionGroup> bulkUnassignFromUsersAndGroups(PermissionGroup permissionGroup, List<User> users, List<UserGroup> groups) {
        ensureAssignedToUserIds(permissionGroup);
        ensureAssignedToUserGroups(permissionGroup);

        List<String> userIds = users.stream().map(User::getId).collect(Collectors.toList());
        List<String> groupIds = groups.stream().map(UserGroup::getId).collect(Collectors.toList());
        permissionGroup.getAssignedToUserIds().removeAll(userIds);
        permissionGroup.getAssignedToGroupIds().removeAll(groupIds);
        return repository.updateById(permissionGroup.getId(), permissionGroup, UNASSIGN_PERMISSION_GROUPS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND)));
    }

    private Mono<PermissionGroup> bulkAssignToUsersAndGroups(PermissionGroup permissionGroup, List<User> users, List<UserGroup> groups) {
        ensureAssignedToUserIds(permissionGroup);
        ensureAssignedToUserGroups(permissionGroup);

        List<String> userIds = users.stream().map(User::getId).collect(Collectors.toList());
        List<String> groupIds = groups.stream().map(UserGroup::getId).collect(Collectors.toList());
        permissionGroup.getAssignedToUserIds().addAll(userIds);
        permissionGroup.getAssignedToGroupIds().addAll(groupIds);
        return repository.updateById(permissionGroup.getId(), permissionGroup, AclPermission.ASSIGN_PERMISSION_GROUPS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND)));

    }

    public Mono<PermissionGroupInfoDTO> updatePermissionGroup(String id, PermissionGroup resource) {
        return repository.findById(id, MANAGE_PERMISSION_GROUPS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "update permission group")))
                .flatMap(permissionGroup -> {
                    // The update API is only supposed to update the NAME and DESCRIPTION of the Permission Group.
                    // ANY OTHER FIELD SHOULD NOT BE UPDATED USING THIS FUNCTION.
                    permissionGroup.setName(resource.getName());
                    permissionGroup.setDescription(resource.getDescription());
                    return super.update(id, permissionGroup);
                })
                .map(savedPermissionGroup -> modelMapper.map(savedPermissionGroup, PermissionGroupInfoDTO.class));
    }

    @Override
    public Mono<RoleViewDTO> createCustomPermissionGroup(PermissionGroup permissionGroup) {
        return this.create(permissionGroup)
                .flatMap(createdPermissionGroup -> this.findConfigurableRoleById(createdPermissionGroup.getId()));
    }

}
