package com.appsmith.server.services;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.QUser;
import com.appsmith.server.domains.QUserGroup;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.dtos.ApiKeyRequestDto;
import com.appsmith.server.dtos.DisconnectProvisioningDto;
import com.appsmith.server.dtos.ProvisionStatusDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.ProvisionUtils;
import com.appsmith.server.helpers.TenantUtils;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.UserGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ce_compatible.ProvisionServiceCECompatibleImpl;
import com.appsmith.server.solutions.UserAndAccessManagementService;
import lombok.AllArgsConstructor;
import net.minidev.json.JSONObject;
import org.jetbrains.annotations.NotNull;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.DELETE_USERS;
import static com.appsmith.server.acl.AclPermission.MANAGE_TENANT;
import static com.appsmith.server.acl.AclPermission.MANAGE_USERS;
import static com.appsmith.server.acl.AclPermission.RESET_PASSWORD_USERS;
import static com.appsmith.server.constants.FieldName.CONFIGURED_STATUS;
import static com.appsmith.server.constants.FieldName.LINKED_USERS;
import static com.appsmith.server.constants.FieldName.PROVISIONING_LAST_UPDATED_AT;
import static com.appsmith.server.constants.FieldName.PROVISIONING_STATUS;
import static com.appsmith.server.constants.FieldName.REMOVED;
import static com.appsmith.server.constants.FieldName.RETAINED;
import static com.appsmith.server.enums.ProvisionStatus.INACTIVE;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;

@Component
@AllArgsConstructor
public class ProvisionServiceImpl extends ProvisionServiceCECompatibleImpl implements ProvisionService {
    private final AnalyticsService analyticsService;
    private final ApiKeyService apiKeyService;
    private final TenantUtils tenantUtils;
    private final TenantService tenantService;
    private final UserRepository userRepository;
    private final UserAndAccessManagementService userAndAccessManagementService;
    private final UserGroupRepository userGroupRepository;
    private final PolicyGenerator policyGenerator;
    private final UserUtils userUtils;
    private final ProvisionUtils provisionUtils;

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_scim_enabled)
    public Mono<String> generateProvisionToken() {
        ApiKeyRequestDto apiKeyRequestDto =
                ApiKeyRequestDto.builder().email(FieldName.PROVISIONING_USER).build();

        // Archive all existing provisioning token.
        // Then generate new provisioning token.
        return tenantUtils
                .enterpriseUpgradeRequired()
                .then(archiveProvisionToken())
                .then(apiKeyService.generateApiKey(apiKeyRequestDto))
                .flatMap(apiKey -> provisionUtils.updateStatus(INACTIVE, true).thenReturn(apiKey));
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_scim_enabled)
    public Mono<ProvisionStatusDTO> getProvisionStatus() {
        // Check if the User has manage tenant permissions
        Mono<Tenant> tenantMono = tenantService
                .getDefaultTenant(MANAGE_TENANT)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "get provisioning status")))
                .cache();

        // Get Provision Status config
        Mono<Config> provisioningStatusConfigMono = provisionUtils.getOrCreateProvisioningStatusConfig();

        return provisioningStatusConfigMono.flatMap(provisioningStatusConfig -> {
            JSONObject config = provisioningStatusConfig.getConfig();

            if (Boolean.FALSE.equals((Boolean) config.get(CONFIGURED_STATUS))) {
                return Mono.just(ProvisionStatusDTO.builder()
                        .provisionStatus(INACTIVE.getValue())
                        .configuredStatus((Boolean) config.get(CONFIGURED_STATUS))
                        .lastUpdatedAt(null)
                        .provisionedUsers(0)
                        .provisionedGroups(0)
                        .build());
            }

            String lastUpdatedAt;
            if (config.containsKey(PROVISIONING_LAST_UPDATED_AT)) {
                lastUpdatedAt = config.getAsString(PROVISIONING_LAST_UPDATED_AT);
            } else {
                lastUpdatedAt = null;
            }

            Mono<Long> provisionedUsersCountMono =
                    userRepository.countAllUsersByIsProvisioned(Boolean.TRUE, Optional.empty());
            Mono<Long> provisionedUserGroupsCountMono =
                    userGroupRepository.countAllUserGroupsByIsProvisioned(Boolean.TRUE, Optional.empty());

            return tenantMono.flatMap(tenant -> Mono.zip(provisionedUsersCountMono, provisionedUserGroupsCountMono)
                    .map(pair -> {
                        Long countProvisionedUsers = pair.getT1();
                        Long countProvisionedUserGroups = pair.getT2();
                        return ProvisionStatusDTO.builder()
                                .provisionStatus(config.getAsString(PROVISIONING_STATUS))
                                .lastUpdatedAt(lastUpdatedAt)
                                .provisionedUsers(countProvisionedUsers)
                                .provisionedGroups(countProvisionedUserGroups)
                                .configuredStatus((Boolean) config.get(CONFIGURED_STATUS))
                                .build();
                    }));
        });
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_scim_enabled)
    public Mono<Boolean> archiveProvisionToken() {
        return apiKeyService.archiveAllApiKeysForUser(FieldName.PROVISIONING_USER);
    }

    /**
     * Disconnect provisioning. Below are the steps which are followed in sequence.
     * <ol>
     *     <li>Deletes users & groups OR Update their access policies.</li>
     *     <li>Updates associated roles</li>
     *     <li>Send Analytics event</li>
     *     <li>Archive existing provisioning token</li>
     *     <li>Updates status</li>
     * </ol>
     * @param disconnectProvisioningDto
     * @implNote Disconnect Provisioning flow needs to be a non-cancellable call, because it can become time-consuming
     * depending upon the number of users, groups and roles which need to be updated.
     * <p>
     * There may be scenarios where the process may take time, and the client cancels the request midway. This leads to
     * the flow getting stopped midway producing corrupted DB objects. The following ensures that even though the client
     * may have cancelled the flow, the provisioning will be disconnected, i.e., users and groups will be updated
     * accordingly (update policies or delete otherwise), roles associated to them will also be updated, and
     * provisioning status will be updated as well.
     * <p>
     * To achieve this, we use a synchronous sink which does not take subscription cancellations into account. This
     * means that even if the subscriber has cancelled its subscription, the create method still generates its event.
     * @return Boolean (whether the process was successful or not.)
     */
    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_scim_enabled)
    public Mono<Boolean> disconnectProvisioning(DisconnectProvisioningDto disconnectProvisioningDto) {
        Mono<Boolean> deleteOrUpdateUsersGroupsAndUpdateAssociatedRolesMono;

        // Check whether user is authorised to MANAGE_TENANT
        // Throw AppsmithError ACTION_IS_NOT_AUTHORIZED
        Mono<Tenant> tenantMono = tenantService
                .getDefaultTenant(MANAGE_TENANT)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "disconnect provisioning")))
                .cache();

        if (disconnectProvisioningDto.isKeepAllProvisionedResources()) {
            deleteOrUpdateUsersGroupsAndUpdateAssociatedRolesMono =
                    transferManagementPoliciesToInstanceAdministratorForAllProvisionedUsersAndGroups(tenantMono);
        } else {
            deleteOrUpdateUsersGroupsAndUpdateAssociatedRolesMono =
                    deleteAllProvisionedUsersAndGroupsAndUpdateAllAssociatedRoles();
        }

        // Delete provisioned users & Groups and update Associated roles or
        // update access policies for all provisioned users and groups
        // then archive provision token
        Mono<Boolean> deleteOrUpdateUsersAndGroupsUpdateRolesAndArchiveTokenMono = tenantMono.flatMap(tenant -> {
            Map<String, Object> analyticsProperties = new HashMap<>();
            if (disconnectProvisioningDto.isKeepAllProvisionedResources()) {
                analyticsProperties.put(LINKED_USERS, RETAINED);
            } else {
                analyticsProperties.put(LINKED_USERS, REMOVED);
            }
            Mono<Tenant> scimDisabledMono =
                    analyticsService.sendObjectEvent(AnalyticsEvents.SCIM_DISABLED, tenant, analyticsProperties);
            return deleteOrUpdateUsersGroupsAndUpdateAssociatedRolesMono
                    .flatMap(usersGroupsRolesUpdated -> scimDisabledMono)
                    .flatMap(tenant1 -> archiveProvisionToken())
                    .flatMap(archiveProvisionToken -> provisionUtils.updateStatus(INACTIVE, false));
        });
        return Mono.create(sink -> deleteOrUpdateUsersAndGroupsUpdateRolesAndArchiveTokenMono.subscribe(
                sink::success, sink::error, null, sink.currentContext()));
    }

    @NotNull private Mono<Boolean> transferManagementPoliciesToInstanceAdministratorForAllProvisionedUsersAndGroups(
            Mono<Tenant> tenantMono) {
        return tenantMono.flatMap(tenant -> {
            // Update permissions for User resources
            // Instance admin role alone should have delete user permission. (Get Role Id from Instance Admin Role)
            // User Management role alone should have manage user permission. (Get Role Id from role id present in RESET
            // PASSWORD USER policy.)
            // Keep the read user permission as is.
            Mono<Boolean> updatedUsersMono =
                    updateAllProvisionedUsersDeleteAndManagePolicyWithSuperAdminAndUserManagementRole();

            // Update the permissions for the User group resources
            // Inherit all the permissions from tenant to user group.
            Mono<Boolean> updateUserGroupsPoliciesMono = updatedAllProvisionedGroupsWithInheritedTenantPolicies(tenant);
            return Mono.zip(updatedUsersMono, updateUserGroupsPoliciesMono).map(pair -> Boolean.TRUE);
        });
    }

    @NotNull private Mono<Boolean> deleteAllProvisionedUsersAndGroupsAndUpdateAllAssociatedRoles() {
        // We are interested only in the policies and email of the provisioned User resources.
        // We are interested only in the policies and users of the provisioned UserGroup resources.
        List<String> includeFieldsUsers = List.of(fieldName(QUser.user.policies), fieldName(QUser.user.email));
        List<String> includeFieldsGroups =
                List.of(fieldName(QUser.user.policies), fieldName(QUserGroup.userGroup.users));
        // find all User with isProvisioned == true
        Mono<List<User>> provisionedUsersMono = userRepository
                .getAllUsersByIsProvisioned(Boolean.TRUE, Optional.of(includeFieldsUsers), Optional.empty())
                .collectList()
                .cache();
        // find all User Groups with isProvisioned == true
        Mono<List<UserGroup>> provisionedGroupsMono = userGroupRepository
                .getAllUserGroupsByIsProvisioned(Boolean.TRUE, Optional.of(includeFieldsGroups), Optional.empty())
                .collectList()
                .cache();

        // Un-assign all these users from all the roles that they are associated with.
        // Un-assign all these usergroups from all the roles that they are associated with.
        Mono<Boolean> unassignProvisionedEntitiesFromAllAssociatedRolesMono = Mono.zip(
                        provisionedUsersMono, provisionedGroupsMono)
                .flatMap(pair -> {
                    List<User> provisionedUsers = pair.getT1();
                    List<UserGroup> provisionedGroups = pair.getT2();
                    return userAndAccessManagementService.unAssignUsersAndGroupsFromAllAssociatedRoles(
                            provisionedUsers, provisionedGroups);
                });

        // delete users.
        // delete user groups.
        Mono<Boolean> deleteAllProvisionedEntitiesMono =
                deleteUsersAndGroups(provisionedUsersMono, provisionedGroupsMono);

        // Un-assign then delete
        return unassignProvisionedEntitiesFromAllAssociatedRolesMono.flatMap(
                unassignedFromRoles -> deleteAllProvisionedEntitiesMono);
    }

    @NotNull private Mono<Boolean> deleteUsersAndGroups(
            Mono<List<User>> provisionedUsersMono, Mono<List<UserGroup>> provisionedGroupsMono) {
        return Mono.zip(provisionedUsersMono, provisionedGroupsMono).flatMap(pair -> {
            List<User> provisionedUsers = pair.getT1();
            List<UserGroup> provisionedGroups = pair.getT2();
            List<String> provisionedUserIds =
                    provisionedUsers.stream().map(User::getId).toList();
            List<String> provisionedGroupIds =
                    provisionedGroups.stream().map(UserGroup::getId).toList();
            Mono<Boolean> deleteProvisionedUsersByIdMono =
                    userRepository.deleteAllById(provisionedUserIds).thenReturn(Boolean.TRUE);
            Mono<Boolean> deleteProvisionedGroupsByIdMono =
                    userGroupRepository.deleteAllById(provisionedGroupIds).thenReturn(Boolean.TRUE);
            return Mono.zip(deleteProvisionedUsersByIdMono, deleteProvisionedGroupsByIdMono)
                    .map(pair1 -> Boolean.TRUE);
        });
    }

    private Mono<Boolean> updateAllProvisionedUsersDeleteAndManagePolicyWithSuperAdminAndUserManagementRole() {
        List<String> includeFieldsUsers = List.of(fieldName(QUser.user.policies));
        Flux<User> provisionedUserFlux = userRepository
                .getAllUsersByIsProvisioned(Boolean.TRUE, Optional.of(includeFieldsUsers), Optional.empty())
                .cache();
        return userUtils
                .getSuperAdminPermissionGroup()
                .flatMap(superAdminRole -> provisionedUserFlux
                        .flatMap(user -> {
                            Set<Policy> updatedUserPolicies =
                                    getUserPoliciesWithUpdatedDeleteAndManageUserPolicies(user, superAdminRole);
                            return userRepository.updateUserPoliciesAndIsProvisionedWithoutPermission(
                                    user.getId(), Boolean.FALSE, updatedUserPolicies);
                        })
                        .collectList())
                .map(list -> Boolean.TRUE);
    }

    private Mono<Boolean> updatedAllProvisionedGroupsWithInheritedTenantPolicies(Tenant tenant) {
        Set<Policy> policies = policyGenerator.getAllChildPolicies(tenant.getPolicies(), Tenant.class, UserGroup.class);
        return userGroupRepository.updateProvisionedUserGroupsPoliciesAndIsProvisionedWithoutPermission(
                Boolean.FALSE, policies);
    }

    private Set<Policy> getUserPoliciesWithUpdatedDeleteAndManageUserPolicies(
            User user, PermissionGroup instanceAdminRole) {
        Set<Policy> policiesWithoutDeleteAndManagePermissions = user.getPolicies().stream()
                .filter(policy -> !policy.getPermission().equals(MANAGE_USERS.getValue())
                        && !policy.getPermission().equals(DELETE_USERS.getValue()))
                .collect(Collectors.toSet());
        Policy resetPasswordPolicy = policiesWithoutDeleteAndManagePermissions.stream()
                .filter(policy -> RESET_PASSWORD_USERS.getValue().equals(policy.getPermission()))
                .findFirst()
                .get();
        Policy deleteUserPolicy = Policy.builder()
                .permission(DELETE_USERS.getValue())
                .permissionGroups(Set.of(instanceAdminRole.getId()))
                .build();
        Policy manageUserPolicy = Policy.builder()
                .permission(MANAGE_USERS.getValue())
                .permissionGroups(resetPasswordPolicy.getPermissionGroups())
                .build();

        Set<Policy> newUserPolicies = new HashSet<>();
        newUserPolicies.addAll(policiesWithoutDeleteAndManagePermissions);
        newUserPolicies.add(deleteUserPolicy);
        newUserPolicies.add(manageUserPolicy);
        return newUserPolicies;
    }
}
