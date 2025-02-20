package com.appsmith.server.services;

import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ce.UserWorkspaceServiceCEImpl;
import com.appsmith.server.solutions.PermissionGroupPermission;
import com.appsmith.server.solutions.WorkspacePermission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class UserWorkspaceServiceImpl extends UserWorkspaceServiceCEImpl implements UserWorkspaceService {

    public UserWorkspaceServiceImpl(
            SessionUserService sessionUserService,
            WorkspaceService workspaceService,
            UserRepository userRepository,
            UserDataService userDataService,
            PermissionGroupService permissionGroupService,
            OrganizationService organizationService,
            WorkspacePermission workspacePermission,
            PermissionGroupPermission permissionGroupPermission) {

        super(
                sessionUserService,
                workspaceService,
                userRepository,
                userDataService,
                permissionGroupService,
                organizationService,
                workspacePermission,
                permissionGroupPermission);
    }
}
