package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.repositories.ConfigRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.ce.PermissionGroupServiceCEImpl;
import com.appsmith.server.solutions.PermissionGroupPermission;
import com.appsmith.server.solutions.PolicySolution;
import jakarta.validation.Validator;
import org.springframework.stereotype.Service;

@Service
public class PermissionGroupServiceCECompatibleImpl extends PermissionGroupServiceCEImpl
        implements PermissionGroupServiceCECompatible {
    public PermissionGroupServiceCECompatibleImpl(
            Validator validator,
            PermissionGroupRepository repository,
            AnalyticsService analyticsService,
            SessionUserService sessionUserService,
            OrganizationService tenantService,
            UserRepository userRepository,
            PolicySolution policySolution,
            ConfigRepository configRepository,
            PermissionGroupPermission permissionGroupPermission) {
        super(
                validator,
                repository,
                analyticsService,
                sessionUserService,
                tenantService,
                userRepository,
                policySolution,
                configRepository,
                permissionGroupPermission);
    }
}
