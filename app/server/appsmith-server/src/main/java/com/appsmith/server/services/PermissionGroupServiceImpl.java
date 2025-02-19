package com.appsmith.server.services;

import com.appsmith.server.repositories.ConfigRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ce_compatible.PermissionGroupServiceCECompatibleImpl;
import com.appsmith.server.solutions.PermissionGroupPermission;
import com.appsmith.server.solutions.PolicySolution;
import jakarta.validation.Validator;
import org.springframework.stereotype.Service;

@Service
public class PermissionGroupServiceImpl extends PermissionGroupServiceCECompatibleImpl
        implements PermissionGroupService {

    public PermissionGroupServiceImpl(
            Validator validator,
            PermissionGroupRepository repository,
            AnalyticsService analyticsService,
            SessionUserService sessionUserService,
            OrganizationService organizationService,
            UserRepository userRepository,
            PolicySolution policySolution,
            ConfigRepository configRepository,
            PermissionGroupPermission permissionGroupPermission) {

        super(
                validator,
                repository,
                analyticsService,
                sessionUserService,
                organizationService,
                userRepository,
                policySolution,
                configRepository,
                permissionGroupPermission);
    }
}
