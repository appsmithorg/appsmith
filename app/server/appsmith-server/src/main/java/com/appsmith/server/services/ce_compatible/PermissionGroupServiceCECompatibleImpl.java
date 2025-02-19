package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.cakes.ConfigRepositoryCake;
import com.appsmith.server.repositories.cakes.PermissionGroupRepositoryCake;
import com.appsmith.server.repositories.cakes.UserRepositoryCake;
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
            PermissionGroupRepository repositoryDirect,
            PermissionGroupRepositoryCake repository,
            AnalyticsService analyticsService,
            SessionUserService sessionUserService,
            OrganizationService organizationService,
            UserRepositoryCake userRepository,
            PolicySolution policySolution,
            ConfigRepositoryCake configRepository,
            PermissionGroupPermission permissionGroupPermission) {
        super(
                validator,
                repositoryDirect,
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
