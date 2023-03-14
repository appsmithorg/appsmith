package com.appsmith.server.services;

import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.repositories.UserDataRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ce.UserWorkspaceServiceCEImpl;
import com.appsmith.server.solutions.PermissionGroupPermission;
import com.appsmith.server.solutions.WorkspacePermission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class UserWorkspaceServiceImpl extends UserWorkspaceServiceCEImpl implements UserWorkspaceService {

    public UserWorkspaceServiceImpl(SessionUserService sessionUserService,
                                    WorkspaceRepository workspaceRepository,
                                    UserRepository userRepository,
                                    UserDataRepository userDataRepository,
                                    PolicyUtils policyUtils,
                                    EmailSender emailSender,
                                    UserDataService userDataService,
                                    PermissionGroupService permissionGroupService,
                                    TenantService tenantService,
                                    WorkspacePermission workspacePermission,
                                    PermissionGroupPermission permissionGroupPermission) {

        super(sessionUserService, workspaceRepository, userRepository, userDataRepository, policyUtils, emailSender,
                userDataService, permissionGroupService, tenantService, workspacePermission, permissionGroupPermission);
    }
}
