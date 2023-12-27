package com.appsmith.server.solutions.ce_compatible;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.dtos.UpdateRoleAssociationDTO;
import com.appsmith.server.dtos.UserForManagementDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.EmailService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.PermissionGroupPermission;
import com.appsmith.server.solutions.ce.UserAndAccessManagementServiceCEImpl;
import org.springframework.stereotype.Component;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
public class UserAndAccessManagementServiceCECompatibleImpl extends UserAndAccessManagementServiceCEImpl
        implements UserAndAccessManagementServiceCECompatible {
    public UserAndAccessManagementServiceCECompatibleImpl(
            SessionUserService sessionUserService,
            PermissionGroupService permissionGroupService,
            WorkspaceService workspaceService,
            UserRepository userRepository,
            AnalyticsService analyticsService,
            UserService userService,
            PermissionGroupPermission permissionGroupPermission,
            EmailService emailService,
            CommonConfig commonConfig) {
        super(
                sessionUserService,
                permissionGroupService,
                workspaceService,
                userRepository,
                analyticsService,
                userService,
                permissionGroupPermission,
                emailService,
                commonConfig);
    }

    @Override
    public Mono<Boolean> deleteProvisionUser(String userId) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<List<UserForManagementDTO>> getAllUsers(MultiValueMap<String, String> queryParams) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<Boolean> changeRoleAssociations(
            UpdateRoleAssociationDTO updateRoleAssociationDTO, String originHeader) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<Boolean> unAssignUsersAndGroupsFromAllAssociatedRoles(List<User> users, List<UserGroup> groups) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }
}
