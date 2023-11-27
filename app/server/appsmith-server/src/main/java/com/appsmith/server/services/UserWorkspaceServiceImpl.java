package com.appsmith.server.services;

import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.repositories.UserDataRepositoryCake;
import com.appsmith.server.repositories.UserRepositoryCake;
import com.appsmith.server.repositories.WorkspaceRepositoryCake;
import com.appsmith.server.services.ce.UserWorkspaceServiceCEImpl;
import com.appsmith.server.solutions.PermissionGroupPermission;
import com.appsmith.server.solutions.PolicySolution;
import com.appsmith.server.solutions.WorkspacePermission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class UserWorkspaceServiceImpl extends UserWorkspaceServiceCEImpl implements UserWorkspaceService {

    public UserWorkspaceServiceImpl(
            SessionUserService sessionUserService,
            WorkspaceRepositoryCake workspaceRepository,
            UserRepositoryCake userRepository,
            UserDataRepositoryCake userDataRepository,
            PolicySolution policySolution,
            EmailSender emailSender,
            UserDataService userDataService,
            PermissionGroupService permissionGroupService,
            TenantService tenantService,
            WorkspacePermission workspacePermission,
            PermissionGroupPermission permissionGroupPermission) {

        super(
                sessionUserService,
                workspaceRepository,
                userRepository,
                userDataRepository,
                policySolution,
                emailSender,
                userDataService,
                permissionGroupService,
                tenantService,
                workspacePermission,
                permissionGroupPermission);
    }
}
