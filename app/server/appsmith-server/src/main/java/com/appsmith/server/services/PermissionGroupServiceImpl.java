package com.appsmith.server.services;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.QPermissionGroup;
import com.appsmith.server.domains.QUserGroup;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.AppsmithComparators;
import com.appsmith.server.helpers.PermissionGroupHelper;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.ConfigRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ce_compatible.PermissionGroupServiceCECompatibleImpl;
import com.appsmith.server.solutions.PermissionGroupPermission;
import com.appsmith.server.solutions.PolicySolution;
import com.appsmith.server.solutions.roles.RoleConfigurationSolution;
import com.appsmith.server.solutions.roles.dtos.RoleViewDTO;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.ObjectUtils;
import org.modelmapper.ModelMapper;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.util.function.Tuple2;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.ASSIGN_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.CREATE_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.DELETE_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.MANAGE_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.READ_PERMISSION_GROUPS;
import static com.appsmith.server.constants.FieldName.NUMBER_OF_ASSIGNED_USER_GROUPS;
import static com.appsmith.server.constants.FieldName.NUMBER_OF_UNASSIGNED_USER_GROUPS;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

@Slf4j
@Service
public class PermissionGroupServiceImpl extends PermissionGroupServiceCECompatibleImpl
        implements PermissionGroupService {

    private final ModelMapper modelMapper;
    private final SessionUserService sessionUserService;
    private final TenantService tenantService;
    private final PolicyGenerator policyGenerator;
    private final UserGroupRepository userGroupRepository;
    private final RoleConfigurationSolution roleConfigurationSolution;
    private final PermissionGroupHelper permissionGroupHelper;
    private final UserUtils userUtils;

    public PermissionGroupServiceImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            PermissionGroupRepository repository,
            AnalyticsService analyticsService,
            SessionUserService sessionUserService,
            TenantService tenantService,
            UserRepository userRepository,
            PolicySolution policySolution,
            ConfigRepository configRepository,
            ModelMapper modelMapper,
            PolicyGenerator policyGenerator,
            UserGroupRepository userGroupRepository,
            RoleConfigurationSolution roleConfigurationSolution,
            PermissionGroupPermission permissionGroupPermission,
            PermissionGroupHelper permissionGroupHelper,
            UserUtils userUtils) {

        super(
                scheduler,
                validator,
                mongoConverter,
                reactiveMongoTemplate,
                repository,
                analyticsService,
                sessionUserService,
                tenantService,
                userRepository,
                policySolution,
                configRepository,
                permissionGroupPermission);
        this.modelMapper = modelMapper;
        this.policyGenerator = policyGenerator;
        this.sessionUserService = sessionUserService;
        this.tenantService = tenantService;
        this.userGroupRepository = userGroupRepository;
        this.roleConfigurationSolution = roleConfigurationSolution;
        this.permissionGroupHelper = permissionGroupHelper;
        this.userUtils = userUtils;
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public Mono<List<PermissionGroupInfoDTO>> getAll() {
        return permissionGroupHelper
                .mapToPermissionGroupInfoDto(repository.findAll(READ_PERMISSION_GROUPS))
                .sort(AppsmithComparators.permissionGroupInfoComparator())
                .collectList();
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public Mono<List<PermissionGroupInfoDTO>> getAllAssignableRoles() {
        return permissionGroupHelper
                .mapToPermissionGroupInfoDto(repository.findAll(ASSIGN_PERMISSION_GROUPS))
                .collectList();
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public Mono<PermissionGroup> findById(String id, AclPermission permission) {
        return repository.findById(id, permission);
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public Flux<PermissionGroup> findAllByAssignedToGroupIdsIn(Set<String> groupIds) {
        return repository.findAllByAssignedToGroupIdsIn(groupIds).flatMap(repository::setUserPermissionsInObject);
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public Flux<PermissionGroup> findAllByAssignedToGroupId(String groupId) {
        return findAllByAssignedToGroupIdsIn(Set.of(groupId));
    }

    /**
     * @implNote The permission group resource should inherit policies from the tenant at all times, and this should not
     * fall behind gac feature flag. Earlier, the migration would add those policy changes, but with 1-click, since the
     * migrations won't run, we should add these policy changes while creating the permission group resource.
     * @param permissionGroup
     * @return
     */
    @Override
    public Mono<PermissionGroup> create(PermissionGroup permissionGroup) {
        Mono<Boolean> isCreateAllowedMono = Mono.zip(
                        sessionUserService.getCurrentUser(), tenantService.getDefaultTenantId())
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

        Mono<PermissionGroup> userPermissionGroupMono = isCreateAllowedMono.flatMap(isCreateAllowed -> {
            if (!isCreateAllowed && permissionGroup.getDefaultDomainType() == null) {
                // Throw an error if the user is not allowed to create a permission group. If default workspace id
                // is set, this permission group is system generated and hence shouldn't error out.
                return Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "Create Role"));
            }

            return Mono.just(permissionGroup);
        });
        Mono<PermissionGroup> createdPermissionMono = Mono.zip(
                        userPermissionGroupMono, tenantService.getDefaultTenant())
                .flatMap(tuple -> {
                    PermissionGroup userPermissionGroup = tuple.getT1();
                    Tenant defaultTenant = tuple.getT2();
                    userPermissionGroup.setTenantId(defaultTenant.getId());

                    userPermissionGroup = generateAndSetPermissionGroupPolicies(defaultTenant, userPermissionGroup);

                    return super.create(userPermissionGroup);
                })
                .cache();

        // make the default workspace roles uneditable
        Mono<PermissionGroup> ifDefaultPgMakeUneditableMono = createdPermissionMono
                .flatMap(pg -> Mono.zip(Mono.just(pg), permissionGroupHelper.isAutoCreated(pg)))
                .flatMap(tuple -> {
                    PermissionGroup permissionGroup1 = tuple.getT1();
                    // If isAutoCreated is TRUE, it's a default document role and hence shouldn't be editable or
                    // deletable
                    if (tuple.getT2()) {
                        Set<Policy> policiesWithoutEditPermission = permissionGroup1.getPolicies().stream()
                                .filter(policy -> !policy.getPermission().equals(MANAGE_PERMISSION_GROUPS.getValue())
                                        && !policy.getPermission().equals(DELETE_PERMISSION_GROUPS.getValue()))
                                .collect(Collectors.toSet());
                        permissionGroup1.setPolicies(policiesWithoutEditPermission);
                        return repository.save(permissionGroup1);
                    } else {
                        // If this is not a default created role, then return the role as is from the DB
                        return repository.findById(permissionGroup1.getId(), READ_PERMISSION_GROUPS);
                    }
                });

        // Clean cache for Users who are assigned to Permission Groups DIRECTLY OR INDIRECTLY(via User Groups)
        // for all the Permission Groups who have READ ACCESS on the newly created Permission Group.
        Mono<Void> cleanUserPermissionGroupMono = createdPermissionMono.flatMap(permissionGroup1 -> {
            Set<String> permissionGroupIdsWithReadAccess = permissionGroup1.getPolicies().stream()
                    .filter(policy -> policy.getPermission().equals(READ_PERMISSION_GROUPS.getValue()))
                    .findFirst()
                    .map(Policy::getPermissionGroups)
                    .orElse(Set.of());
            return repository
                    .findAllById(permissionGroupIdsWithReadAccess)
                    .flatMap(this::getAllDirectlyAndIndirectlyAssignedUserIds)
                    .collectList()
                    .map(userIdSetList -> {
                        Set<String> userIdSet = new HashSet<>();
                        userIdSetList.forEach(userIds -> userIdSet.addAll(userIds));
                        return userIdSet;
                    })
                    .flatMap(userIdsSet -> cleanPermissionGroupCacheForUsers(
                            userIdsSet.stream().toList()));
        });

        return Mono.zip(ifDefaultPgMakeUneditableMono, cleanUserPermissionGroupMono.thenReturn(TRUE))
                .map(Tuple2::getT1);
    }

    private PermissionGroup generateAndSetPermissionGroupPolicies(Tenant tenant, PermissionGroup permissionGroup) {
        Set<Policy> policies =
                policyGenerator.getAllChildPolicies(tenant.getPolicies(), Tenant.class, PermissionGroup.class);
        permissionGroup.setPolicies(policies);
        return permissionGroup;
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public Mono<PermissionGroup> archiveById(String id) {
        Mono<PermissionGroup> permissionGroupMono = repository
                .findById(id, DELETE_PERMISSION_GROUPS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS)))
                .cache();
        // Clean cache for Users who are assigned to Permission Groups DIRECTLY OR INDIRECTLY(via User Groups)
        // for all the Permission Groups who have READ ACCESS on the newly created Permission Group.
        Mono<Void> cleanUserPermissionGroupMono = permissionGroupMono.flatMap(permissionGroup1 -> {
            Set<String> permissionGroupIdsWithReadAccess = permissionGroup1.getPolicies().stream()
                    .filter(policy -> policy.getPermission().equals(READ_PERMISSION_GROUPS.getValue()))
                    .findFirst()
                    .map(Policy::getPermissionGroups)
                    .orElse(Set.of());
            return repository
                    .findAllById(permissionGroupIdsWithReadAccess)
                    .flatMap(this::getAllDirectlyAndIndirectlyAssignedUserIds)
                    .collectList()
                    .map(userIdSetList -> {
                        Set<String> userIdSet = new HashSet<>();
                        userIdSetList.forEach(userIds -> userIdSet.addAll(userIds));
                        return userIdSet;
                    })
                    .flatMap(userIdsSet -> cleanPermissionGroupCacheForUsers(
                            userIdsSet.stream().toList()));
        });

        // TODO : Untested : Please test.
        return permissionGroupMono
                .flatMap(permissionGroup -> {
                    return Mono.zip(
                                    bulkUnassignUsersFromPermissionGroupsWithoutPermission(
                                            permissionGroup.getAssignedToUserIds(), Set.of(id)),
                                    bulkUnassignFromUserGroupsWithoutPermission(
                                            permissionGroup, permissionGroup.getAssignedToGroupIds()),
                                    cleanUserPermissionGroupMono.thenReturn(TRUE))
                            .then(repository.archiveById(id));
                })
                .then(permissionGroupMono.flatMap(analyticsService::sendDeleteEvent));
    }

    @Override
    public Mono<PermissionGroup> bulkUnassignFromUserGroupsWithoutPermission(
            PermissionGroup permissionGroup, Set<String> userGroupIds) {

        return userGroupRepository
                .findAllById(userGroupIds)
                .collect(Collectors.toSet())
                .flatMap(userGroups -> {
                    Set<String> assignedToGroupIds = permissionGroup.getAssignedToGroupIds();
                    assignedToGroupIds.removeAll(userGroupIds);

                    // Get the userIds from all the user groups that we are unassigning
                    List<String> userIds = userGroups.stream()
                            .map(ug -> ug.getUsers())
                            .flatMap(Collection::stream)
                            .collect(Collectors.toList());

                    Update updateObj = new Update();
                    String path = fieldName(QPermissionGroup.permissionGroup.assignedToGroupIds);

                    updateObj.set(path, assignedToGroupIds);
                    Mono<Integer> updatePermissionGroupResultMono =
                            repository.updateById(permissionGroup.getId(), updateObj);
                    Mono<Boolean> clearCacheForUsersMono =
                            cleanPermissionGroupCacheForUsers(userIds).thenReturn(TRUE);
                    return updatePermissionGroupResultMono
                            .then(clearCacheForUsersMono)
                            .then(repository.findById(permissionGroup.getId()));
                });
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public Mono<PermissionGroup> bulkUnassignFromUserGroups(
            PermissionGroup permissionGroup, Set<UserGroup> userGroups) {
        ensureAssignedToUserGroups(permissionGroup);

        // Get the userIds from all the user groups that we are unassigning
        List<String> userIds = userGroups.stream()
                .map(ug -> ug.getUsers())
                .flatMap(Collection::stream)
                .collect(Collectors.toList());

        // Remove the user groups from the permission group
        List<String> userGroupIds = userGroups.stream().map(UserGroup::getId).collect(Collectors.toList());
        userGroupIds.forEach(permissionGroup.getAssignedToGroupIds()::remove);

        Mono<PermissionGroup> updatePermissionGroupMono = repository.updateById(
                permissionGroup.getId(), permissionGroup, AclPermission.UNASSIGN_PERMISSION_GROUPS);

        Mono<Boolean> clearCacheForUsersMono =
                cleanPermissionGroupCacheForUsers(userIds).thenReturn(TRUE);

        return updatePermissionGroupMono
                .zipWhen(updatedPermissionGroup -> clearCacheForUsersMono)
                .map(tuple -> tuple.getT1());
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public Mono<RoleViewDTO> findConfigurableRoleById(String id) {
        // The user should have atleast READ_PERMISSION_GROUPS permission to view the role. The edits would be allowed
        // via
        // MANAGE_PERMISSION_GROUPS permission.
        return repository
                .findById(id, READ_PERMISSION_GROUPS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS)))
                .flatMap(permissionGroup -> roleConfigurationSolution
                        .getAllTabViews(permissionGroup.getId())
                        .map(roleViewDTO -> {
                            roleViewDTO.setId(permissionGroup.getId());
                            roleViewDTO.setName(permissionGroup.getName());
                            roleViewDTO.setDescription(permissionGroup.getDescription());
                            roleViewDTO.setUserPermissions(permissionGroup.getUserPermissions());
                            return roleViewDTO;
                        }));
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public Mono<PermissionGroupInfoDTO> updatePermissionGroup(String id, PermissionGroup resource) {
        return repository
                .findById(id, MANAGE_PERMISSION_GROUPS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "update role")))
                .zipWith(userUtils.getDefaultUserPermissionGroup())
                .flatMap(tuple -> {
                    PermissionGroup permissionGroup = tuple.getT1();
                    PermissionGroup defaultUserRole = tuple.getT2();

                    if (id.equals(defaultUserRole.getId())) {
                        return Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "update role"));
                    }
                    // The update API is only supposed to update the NAME and DESCRIPTION of the Permission Group.
                    // ANY OTHER FIELD SHOULD NOT BE UPDATED USING THIS FUNCTION.
                    permissionGroup.setName(resource.getName());
                    permissionGroup.setDescription(resource.getDescription());
                    return super.update(id, permissionGroup);
                })
                .map(savedPermissionGroup -> modelMapper.map(savedPermissionGroup, PermissionGroupInfoDTO.class));
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public Mono<RoleViewDTO> createCustomPermissionGroup(PermissionGroup permissionGroup) {
        return this.create(permissionGroup)
                .flatMap(analyticsService::sendCreateEvent)
                .flatMap(createdPermissionGroup -> this.findConfigurableRoleById(createdPermissionGroup.getId()));
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public Flux<PermissionGroup> getAllByAssignedToUserGroupAndDefaultWorkspace(
            UserGroup userGroup, Workspace defaultWorkspace, AclPermission aclPermission) {
        return repository.findAllByAssignedToUserGroupIdAndDefaultWorkspaceId(
                userGroup.getId(), defaultWorkspace.getId(), aclPermission);
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public Mono<PermissionGroup> unassignFromUserGroup(PermissionGroup permissionGroup, UserGroup userGroup) {
        return bulkUnassignFromUserGroups(permissionGroup, Set.of(userGroup));
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public Mono<PermissionGroup> assignToUserGroup(PermissionGroup permissionGroup, UserGroup userGroup) {
        return this.bulkAssignToUserGroups(permissionGroup, Set.of(userGroup));
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public Mono<PermissionGroup> bulkAssignToUserGroups(PermissionGroup permissionGroup, Set<UserGroup> userGroups) {
        ensureAssignedToUserGroups(permissionGroup);
        // Get the userIds from all the user groups that we are unassigning
        List<String> userIds = userGroups.stream()
                .map(ug -> ug.getUsers())
                .flatMap(Collection::stream)
                .collect(Collectors.toList());
        List<String> userGroupIds = userGroups.stream().map(UserGroup::getId).collect(Collectors.toList());
        permissionGroup.getAssignedToGroupIds().addAll(userGroupIds);
        Mono<PermissionGroup> permissionGroupUpdateMono = repository
                .updateById(permissionGroup.getId(), permissionGroup, ASSIGN_PERMISSION_GROUPS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND)));

        Mono<Boolean> clearCacheForUsersMono =
                cleanPermissionGroupCacheForUsers(userIds).thenReturn(TRUE);

        return permissionGroupUpdateMono
                .zipWhen(updatedPermissionGroup -> clearCacheForUsersMono)
                .map(tuple -> tuple.getT1());
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public Mono<Set<String>> getAllDirectlyAndIndirectlyAssignedUserIds(PermissionGroup permissionGroup) {
        if (ObjectUtils.isEmpty(permissionGroup.getAssignedToGroupIds())
                && ObjectUtils.isEmpty(permissionGroup.getAssignedToUserIds())) {
            return Mono.just(Set.of());
        }
        Set<String> directAssignedUserIds = ObjectUtils.isEmpty(permissionGroup.getAssignedToUserIds())
                ? Set.of()
                : permissionGroup.getAssignedToUserIds();

        if (ObjectUtils.isNotEmpty(permissionGroup.getAssignedToGroupIds())) {
            return userGroupRepository
                    .findAllById(permissionGroup.getAssignedToGroupIds())
                    .collectList()
                    .map(userGroupList -> userGroupList.stream()
                            .map(UserGroup::getUsers)
                            .flatMap(Collection::stream)
                            .collect(Collectors.toSet()))
                    .map(indirectAssignedUserIds -> {
                        indirectAssignedUserIds.addAll(directAssignedUserIds);
                        return indirectAssignedUserIds;
                    });
        }
        return Mono.just(directAssignedUserIds);
    }

    /**
     * Used to delete the Permission Groups without permission.
     * @param id
     * @return
     * @implNote We don't need to feature flag this method, because we are unassigning the permission group from
     * user group without permission, and this will lead to cleaning of cache, which is required.
     */
    @Override
    public Mono<Void> deleteWithoutPermission(String id) {
        Mono<Void> deleteRoleMono = super.deleteWithoutPermission(id).cache();
        Mono<PermissionGroup> roleMono = repository.findById(id);
        /*
         * bulkUnassignFromUserGroupsWithoutPermission is being used here, because in addition to unassigning user
         * groups, it will clean cache for users who have access to this role, via user group.
         */
        return roleMono.flatMap(role -> bulkUnassignFromUserGroupsWithoutPermission(role, role.getAssignedToGroupIds()))
                .then(deleteRoleMono);
    }

    @Override
    public Flux<PermissionGroup> getAllDefaultRolesForApplication(
            Application application, Optional<AclPermission> aclPermission) {
        return repository.findByDefaultApplicationId(application.getId(), aclPermission);
    }

    private Mono<PermissionGroup> sendAssignedToPermissionGroupEvent(
            PermissionGroup permissionGroup, List<String> usernames, List<String> userGroupNames) {
        Mono<PermissionGroup> sendAssignedUsersToPermissionGroupEvent =
                sendEventUsersAssociatedToRole(permissionGroup, usernames);
        Mono<PermissionGroup> sendAssignedUserGroupsTpPermissionGroupEvent =
                sendEventUserGroupsAssociatedToRole(permissionGroup, userGroupNames);
        return Mono.when(sendAssignedUsersToPermissionGroupEvent, sendAssignedUserGroupsTpPermissionGroupEvent)
                .thenReturn(permissionGroup);
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public Mono<PermissionGroup> bulkAssignToUsersAndGroups(
            PermissionGroup role, List<User> users, List<UserGroup> groups) {
        ensureAssignedToUserIds(role);
        ensureAssignedToUserGroups(role);

        List<String> userIds = users.stream().map(User::getId).toList();
        List<String> groupIds = groups.stream().map(UserGroup::getId).toList();
        role.getAssignedToUserIds().addAll(userIds);
        role.getAssignedToGroupIds().addAll(groupIds);
        List<String> usernames = users.stream().map(User::getUsername).collect(Collectors.toList());
        List<String> userGroupNames = groups.stream().map(UserGroup::getName).collect(Collectors.toList());
        Mono<PermissionGroup> updatedRoleMono = repository
                .updateById(role.getId(), role, AclPermission.ASSIGN_PERMISSION_GROUPS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND)))
                .cache();

        Mono<PermissionGroup> updateEventGetRoleMono = updatedRoleMono.flatMap(
                permissionGroup1 -> sendAssignedToPermissionGroupEvent(permissionGroup1, usernames, userGroupNames));

        Mono<Boolean> cleanCacheForAllUsersAssignedDirectlyIndirectly = updatedRoleMono.flatMap(updatedRole -> {
            List<String> usersIdsInGroups = groups.stream()
                    .map(UserGroup::getUsers)
                    .flatMap(Collection::stream)
                    .toList();
            List<String> userIdsForCacheCleaning = new ArrayList<>();
            userIdsForCacheCleaning.addAll(userIds);
            userIdsForCacheCleaning.addAll(usersIdsInGroups);
            return cleanPermissionGroupCacheForUsers(userIdsForCacheCleaning).thenReturn(TRUE);
        });

        return cleanCacheForAllUsersAssignedDirectlyIndirectly
                .then(updateEventGetRoleMono)
                .then(updatedRoleMono);
    }

    protected Mono<PermissionGroup> sendEventUserGroupsAssociatedToRole(
            PermissionGroup permissionGroup, List<String> groupNames) {
        Mono<PermissionGroup> sendAssignedUsersToPermissionGroupEvent = Mono.just(permissionGroup);
        if (CollectionUtils.isNotEmpty(groupNames)) {
            Map<String, Object> eventData = Map.of(FieldName.ASSIGNED_USER_GROUPS_TO_PERMISSION_GROUPS, groupNames);
            Map<String, Object> extraPropsForCloudHostedInstance =
                    Map.of(FieldName.ASSIGNED_USER_GROUPS_TO_PERMISSION_GROUPS, groupNames);
            Map<String, Object> analyticsProperties = Map.of(
                    NUMBER_OF_ASSIGNED_USER_GROUPS,
                    groupNames.size(),
                    FieldName.EVENT_DATA,
                    eventData,
                    FieldName.CLOUD_HOSTED_EXTRA_PROPS,
                    extraPropsForCloudHostedInstance);
            sendAssignedUsersToPermissionGroupEvent = analyticsService.sendObjectEvent(
                    AnalyticsEvents.ASSIGNED_USER_GROUPS_TO_PERMISSION_GROUP, permissionGroup, analyticsProperties);
        }
        return sendAssignedUsersToPermissionGroupEvent;
    }

    protected Mono<PermissionGroup> sendEventUserGroupsRemovedFromRole(
            PermissionGroup permissionGroup, List<String> groupNames) {
        Mono<PermissionGroup> sendUnAssignedUsersToPermissionGroupEvent = Mono.just(permissionGroup);
        if (CollectionUtils.isNotEmpty(groupNames)) {
            Map<String, Object> eventData = Map.of(FieldName.UNASSIGNED_USER_GROUPS_FROM_PERMISSION_GROUPS, groupNames);
            Map<String, Object> extraPropsForCloudHostedInstance =
                    Map.of(FieldName.UNASSIGNED_USER_GROUPS_FROM_PERMISSION_GROUPS, groupNames);
            Map<String, Object> analyticsProperties = Map.of(
                    NUMBER_OF_UNASSIGNED_USER_GROUPS,
                    groupNames.size(),
                    FieldName.EVENT_DATA,
                    eventData,
                    FieldName.CLOUD_HOSTED_EXTRA_PROPS,
                    extraPropsForCloudHostedInstance);
            sendUnAssignedUsersToPermissionGroupEvent = analyticsService.sendObjectEvent(
                    AnalyticsEvents.UNASSIGNED_USER_GROUPS_FROM_PERMISSION_GROUP, permissionGroup, analyticsProperties);
        }
        return sendUnAssignedUsersToPermissionGroupEvent;
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public Mono<PermissionGroup> assignToUserGroupAndSendEvent(PermissionGroup permissionGroup, UserGroup userGroup) {
        return bulkAssignToUserGroupsAndSendEvent(permissionGroup, Set.of(userGroup));
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public Mono<PermissionGroup> bulkAssignToUserGroupsAndSendEvent(
            PermissionGroup permissionGroup, Set<UserGroup> userGroups) {
        List<String> groupNames = userGroups.stream().map(UserGroup::getName).toList();
        return bulkAssignToUserGroups(permissionGroup, userGroups)
                .flatMap(permissionGroup1 -> sendEventUserGroupsAssociatedToRole(permissionGroup1, groupNames));
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public Mono<PermissionGroup> unAssignFromUserGroupAndSendEvent(
            PermissionGroup permissionGroup, UserGroup userGroup) {
        return bulkUnAssignFromUserGroupsAndSendEvent(permissionGroup, Set.of(userGroup));
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public Mono<PermissionGroup> bulkUnAssignFromUserGroupsAndSendEvent(
            PermissionGroup permissionGroup, Set<UserGroup> userGroups) {
        List<String> groupNames = userGroups.stream().map(UserGroup::getName).toList();
        return bulkUnassignFromUserGroups(permissionGroup, userGroups)
                .flatMap(permissionGroup1 -> sendEventUserGroupsRemovedFromRole(permissionGroup1, groupNames));
    }

    /**
     * The method will get all the roles assigned to user.
     * Here, we have added a filter to remove the User Management roles, because it is internal
     * to Appsmith, and should not be shown to users.
     * @param userIds
     * @return
     */
    private Flux<PermissionGroup> getRoleNamesAssignedToUserIds(Set<String> userIds) {
        List<String> includeFields = List.of(
                fieldName(QPermissionGroup.permissionGroup.id),
                fieldName(QPermissionGroup.permissionGroup.name),
                fieldName(QPermissionGroup.permissionGroup.policies));
        return repository
                .findAllByAssignedToUserIn(userIds, Optional.of(includeFields), Optional.empty())
                .filter(role -> !permissionGroupHelper.isUserManagementRole(role));
    }

    /**
     * The method will get all the roles assigned to group.
     **/
    private Flux<PermissionGroup> getRolesAssignedToGroupIdsWithoutPermission(Set<String> groupIds) {
        List<String> includeFields = List.of(
                fieldName(QPermissionGroup.permissionGroup.id), fieldName(QPermissionGroup.permissionGroup.name));
        return repository.findAllByAssignedToGroupIds(groupIds, Optional.of(includeFields), Optional.empty());
    }

    private Flux<PermissionGroup> getRoleNamesAssignedToUserIdsViaGroups(Set<String> userIds) {
        List<String> includeFields = List.of(fieldName(QUserGroup.userGroup.id));
        return userGroupRepository
                .findAllByUsersIn(userIds, Optional.empty(), Optional.of(includeFields))
                .mapNotNull(UserGroup::getId)
                .collect(Collectors.toSet())
                .flatMapMany(this::getRolesAssignedToGroupIdsWithoutPermission);
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public Mono<Boolean> bulkUnAssignUsersAndUserGroupsFromPermissionGroupsWithoutPermission(
            List<User> users, List<UserGroup> groups, List<PermissionGroup> roles) {
        Set<String> userIds = users.stream().map(User::getId).collect(Collectors.toSet());
        Set<String> groupIds = groups.stream().map(UserGroup::getId).collect(Collectors.toSet());
        roles.forEach(role -> {
            role.getAssignedToUserIds().removeAll(userIds);
            role.getAssignedToGroupIds().removeAll(groupIds);
        });
        Mono<Void> updateRolesMono = Flux.fromIterable(roles)
                .flatMap(role -> {
                    Update update = new Update();
                    update.set(
                            fieldName(QPermissionGroup.permissionGroup.assignedToUserIds), role.getAssignedToUserIds());
                    update.set(
                            fieldName(QPermissionGroup.permissionGroup.assignedToGroupIds),
                            role.getAssignedToGroupIds());
                    return repository.updateById(role.getId(), update);
                })
                .then();

        List<String> userIdsForClearingCache = new ArrayList<>(groups.stream()
                .map(UserGroup::getUsers)
                .flatMap(Collection::stream)
                .toList());
        userIdsForClearingCache.addAll(userIds);
        Mono<Void> clearCacheForUsers = cleanPermissionGroupCacheForUsers(userIdsForClearingCache);
        return updateRolesMono.then(clearCacheForUsers).thenReturn(TRUE);
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public Mono<Boolean> bulkAssignUsersAndUserGroupsToPermissionGroupsWithoutPermission(
            List<User> users, List<UserGroup> groups, List<PermissionGroup> roles) {
        Set<String> userIds = users.stream().map(User::getId).collect(Collectors.toSet());
        Set<String> groupIds = groups.stream().map(UserGroup::getId).collect(Collectors.toSet());
        roles.forEach(role -> {
            role.getAssignedToUserIds().addAll(userIds);
            role.getAssignedToGroupIds().addAll(groupIds);
        });
        Mono<Void> updateRolesMono = Flux.fromIterable(roles)
                .flatMap(role -> {
                    Update update = new Update();
                    update.set(
                            fieldName(QPermissionGroup.permissionGroup.assignedToUserIds), role.getAssignedToUserIds());
                    update.set(
                            fieldName(QPermissionGroup.permissionGroup.assignedToGroupIds),
                            role.getAssignedToGroupIds());
                    return repository.updateById(role.getId(), update);
                })
                .then();

        List<String> userIdsForClearingCache = new ArrayList<>(groups.stream()
                .map(UserGroup::getUsers)
                .flatMap(Collection::stream)
                .toList());
        userIdsForClearingCache.addAll(userIds);
        Mono<Void> clearCacheForUsers = cleanPermissionGroupCacheForUsers(userIdsForClearingCache);
        return updateRolesMono.then(clearCacheForUsers).thenReturn(TRUE);
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public Flux<PermissionGroup> findAllByAssignedToGroupIdsInWithoutPermission(Set<String> groupIds) {
        return repository.findAllByAssignedToGroupIds(groupIds, Optional.empty(), Optional.empty());
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public Flux<PermissionGroup> findAllByAssignedToGroupIdWithoutPermission(String groupId) {
        return findAllByAssignedToGroupIdsInWithoutPermission(Set.of(groupId));
    }

    @Override
    public Flux<PermissionGroup> findAllByAssignedToUsersIn(Set<String> userIds) {
        return repository.findAllByAssignedToUserIds(userIds, READ_PERMISSION_GROUPS);
    }

    @Override
    public Mono<Boolean> bulkUnassignUserFromPermissionGroupsWithoutPermission(
            User user, Set<String> permissionGroupIds) {
        return repository
                .findAllById(permissionGroupIds)
                .flatMap(pg -> {
                    // Delete the User Management Role if user is being disassociated from it.
                    if (permissionGroupHelper.isUserManagementRole(pg)) {
                        return repository.delete(pg);
                    }

                    Set<String> assignedToUserIds = pg.getAssignedToUserIds();
                    assignedToUserIds.remove(user.getId());

                    Update updateObj = new Update();
                    String path = fieldName(QPermissionGroup.permissionGroup.assignedToUserIds);

                    updateObj.set(path, assignedToUserIds);
                    Mono<Integer> updateAssignedToUserIdsForRoleMono = repository.updateById(pg.getId(), updateObj);

                    // Trigger disassociation from role event, if the role is not Default Role For All Users.
                    Mono<Long> sendEventUserRemovedFromRoleIfRoleIsNotDefaultRoleMono = permissionGroupHelper
                            .getDefaultRoleForAllUserRoleId()
                            .flatMap(defaultRoleId -> {
                                if (!defaultRoleId.equals(pg.getId())) {
                                    return sendEventUserRemovedFromRole(pg, List.of(user.getEmail()))
                                            .thenReturn(1L);
                                }
                                return Mono.just(1L);
                            });
                    return updateAssignedToUserIdsForRoleMono.then(
                            sendEventUserRemovedFromRoleIfRoleIsNotDefaultRoleMono);
                })
                .then(Mono.just(TRUE));
    }

    @Override
    public Flux<PermissionGroup> findAllByAssignedToUserId(String userId) {
        return findAllByAssignedToUsersIn(Set.of(userId));
    }

    @Override
    public Mono<Boolean> bulkAssignToUsersWithoutPermission(PermissionGroup pg, List<User> users) {
        ensureAssignedToUserIds(pg);
        List<String> userIds = users.stream().map(User::getId).collect(Collectors.toList());
        Update updateAssignedToUserIdsUpdate = new Update();
        updateAssignedToUserIdsUpdate
                .addToSet(fieldName(QPermissionGroup.permissionGroup.assignedToUserIds))
                .each(userIds.toArray());

        Mono<Integer> permissionGroupUpdateMono = repository.updateById(pg.getId(), updateAssignedToUserIdsUpdate);

        Mono<Void> clearCacheForUsersMono = cleanPermissionGroupCacheForUsers(userIds);

        return permissionGroupUpdateMono.then(clearCacheForUsersMono).thenReturn(TRUE);
    }

    @Override
    public Flux<PermissionGroup> findAllByAssignedToUserIdsInWithoutPermission(Set<String> userIds) {
        return repository.findAllByAssignedToUserIds(userIds, Optional.empty(), Optional.empty());
    }

    @Override
    public Flux<PermissionGroup> findAllByAssignedToUserIdWithoutPermission(String userId) {
        return findAllByAssignedToUserIdsInWithoutPermission(Set.of(userId));
    }

    /**
     * <p>
     *     This method is used to get names of all distinct roles associated to the user.
     * </p>
     * <p>
     *     Roles can be associated to the user either
     *     <ul>
     *          <li><b>directly (if the roles are associated directly to the user)</b></li>
     *          <li><b>indirectly (if the roles are associated to groups, and users are part of those groups)</b></li>
     *     </ul>
     * </p>
     * @param userIds
     * @return Flux of String
     * @implNote The method does not return "<u><b>the user management roles</b></u>" which are associated to individual
     * users.
     */
    @Override
    public Flux<String> getRoleNamesAssignedDirectlyOrIndirectlyToUserIds(Set<String> userIds) {
        Flux<PermissionGroup> rolesAssignedToUserIdsFlux = getRoleNamesAssignedToUserIds(userIds);
        Flux<PermissionGroup> rolesAssignedToUserIdsViaGroupsFlux = getRoleNamesAssignedToUserIdsViaGroups(userIds);

        return Flux.concat(rolesAssignedToUserIdsFlux, rolesAssignedToUserIdsViaGroupsFlux)
                .distinct(PermissionGroup::getId)
                .map(PermissionGroup::getName);
    }

    @Override
    public Flux<PermissionGroup> findAllByAssignedToGroupIds(
            Set<String> groupIds, Optional<List<String>> listIncludeFields, Optional<AclPermission> aclPermission) {
        return repository.findAllByAssignedToGroupIds(groupIds, listIncludeFields, aclPermission);
    }
}
