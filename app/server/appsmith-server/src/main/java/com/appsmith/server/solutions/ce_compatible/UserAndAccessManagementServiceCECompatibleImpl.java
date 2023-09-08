package com.appsmith.server.solutions.ce_compatible;

import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.PermissionGroupPermission;
import com.appsmith.server.solutions.ce.UserAndAccessManagementServiceCEImpl;
import org.springframework.stereotype.Component;

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
            EmailSender emailSender,
            PermissionGroupPermission permissionGroupPermission) {
        super(
                sessionUserService,
                permissionGroupService,
                workspaceService,
                userRepository,
                analyticsService,
                userService,
                emailSender,
                permissionGroupPermission);
    }
}
