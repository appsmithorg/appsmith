package com.appsmith.server.services;

import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.constants.AccessControlConstants;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.dtos.UserProfileDTO;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.repositories.UserGroupRepository;
import com.appsmith.server.services.ce_compatible.PACConfigurationServiceCECompatibleImpl;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@Slf4j
public class PACConfigurationServiceImpl extends PACConfigurationServiceCECompatibleImpl
        implements PACConfigurationService {

    private final PermissionGroupService permissionGroupService;
    private final UserGroupRepository userGroupRepository;
    private final CommonConfig commonConfig;

    public PACConfigurationServiceImpl(
            @Lazy PermissionGroupService permissionGroupService,
            UserGroupRepository userGroupRepository,
            CommonConfig commonConfig) {
        this.permissionGroupService = permissionGroupService;
        this.userGroupRepository = userGroupRepository;
        this.commonConfig = commonConfig;
    }

    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_pac_enabled)
    @Override
    public Mono<TenantConfiguration> getTenantConfiguration(TenantConfiguration tenantConfiguration) {
        return Mono.just(tenantConfiguration);
    }

    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_pac_enabled)
    @Override
    public Mono<TenantConfiguration> updateTenantConfiguration(TenantConfiguration tenantConfiguration) {
        return Mono.just(tenantConfiguration);
    }

    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_pac_enabled)
    @Override
    public Mono<UserProfileDTO> setRolesAndGroups(
            UserProfileDTO profile, User user, boolean showUsersAndGroups, boolean isCloudHosting) {
        if (Boolean.TRUE.equals(commonConfig.isCloudHosting())) {
            return super.setRolesAndGroups(profile, user, showUsersAndGroups, isCloudHosting);
        }

        if (showUsersAndGroups) {
            Mono<List<String>> rolesUserHasBeenAssignedMono = Mono.just(List.of());
            Mono<List<String>> groupsUsersIsPartOfMono = Mono.just(List.of());

            if (StringUtils.isNotEmpty(user.getId())) {
                rolesUserHasBeenAssignedMono = permissionGroupService
                        .getRoleNamesAssignedDirectlyOrIndirectlyToUserIds(Set.of(user.getId()))
                        .collectList();
                groupsUsersIsPartOfMono = userGroupRepository
                        .getAllByUsersIn(
                                Set.of(user.getId()), Optional.of(List.of(UserGroup.Fields.name)), Optional.empty())
                        .map(UserGroup::getName)
                        .collectList();
            }

            return Mono.zip(rolesUserHasBeenAssignedMono, groupsUsersIsPartOfMono)
                    .map(pair2 -> {
                        List<String> rolesAssigned = pair2.getT1();
                        List<String> memberOfRoles = pair2.getT2();
                        profile.setRoles(rolesAssigned);
                        profile.setGroups(memberOfRoles);
                        return profile;
                    });
        } else {
            profile.setRoles(List.of(AccessControlConstants.ENABLE_PROGRAMMATIC_ACCESS_CONTROL_IN_ADMIN_SETTINGS));
            profile.setGroups(List.of(AccessControlConstants.ENABLE_PROGRAMMATIC_ACCESS_CONTROL_IN_ADMIN_SETTINGS));
            return Mono.just(profile);
        }
    }
}
