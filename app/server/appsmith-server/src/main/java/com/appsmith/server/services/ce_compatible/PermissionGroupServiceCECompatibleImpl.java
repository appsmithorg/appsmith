package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.repositories.ConfigRepositoryCake;
import com.appsmith.server.repositories.PermissionGroupRepositoryCake;
import com.appsmith.server.repositories.UserRepositoryCake;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.services.ce.PermissionGroupServiceCEImpl;
import com.appsmith.server.solutions.PermissionGroupPermission;
import com.appsmith.server.solutions.PolicySolution;
import jakarta.validation.Validator;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

@Service
public class PermissionGroupServiceCECompatibleImpl extends PermissionGroupServiceCEImpl
        implements PermissionGroupServiceCECompatible {
    public PermissionGroupServiceCECompatibleImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            PermissionGroupRepositoryCake repository,
            AnalyticsService analyticsService,
            SessionUserService sessionUserService,
            TenantService tenantService,
            UserRepositoryCake userRepository,
            PolicySolution policySolution,
            ConfigRepositoryCake configRepository,
            PermissionGroupPermission permissionGroupPermission) {
        super(
                scheduler,
                validator,
                mongoConverter,
                reactiveMongoTemplate,
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
