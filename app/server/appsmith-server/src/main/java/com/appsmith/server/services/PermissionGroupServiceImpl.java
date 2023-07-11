package com.appsmith.server.services;

import com.appsmith.server.repositories.ConfigRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ce.PermissionGroupServiceCEImpl;
import com.appsmith.server.solutions.PermissionGroupPermission;
import com.appsmith.server.solutions.PolicySolution;
import jakarta.validation.Validator;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

@Service
public class PermissionGroupServiceImpl extends PermissionGroupServiceCEImpl implements PermissionGroupService {

    public PermissionGroupServiceImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            PermissionGroupRepository repository,
            AnalyticsService analyticsService,
            SessionUserService sessionUserService,
            TenantService tenantService,
            UserRepository userRepository,
            PolicySolution policySolution,
            ConfigRepository configRepository,
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
