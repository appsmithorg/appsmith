package com.appsmith.server.solutions;

import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ce.UserAndAccessManagementServiceCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class UserAndAccessManagementServiceImpl extends UserAndAccessManagementServiceCEImpl implements UserAndAccessManagementService {

    public UserAndAccessManagementServiceImpl(SessionUserService sessionUserService,
                                              PermissionGroupService permissionGroupService,
                                              WorkspaceService workspaceService,
                                              UserRepository userRepository,
                                              AnalyticsService analyticsService,
                                              UserService userService,
                                              EmailSender emailSender) {

        super(sessionUserService, permissionGroupService, workspaceService, userRepository, analyticsService, userService, emailSender);
    }
}
