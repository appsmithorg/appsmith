package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.AssetRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.AssetService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.ce.WorkspaceServiceCEImpl;
import com.appsmith.server.solutions.PermissionGroupPermission;
import com.appsmith.server.solutions.PolicySolution;
import com.appsmith.server.solutions.WorkspacePermission;
import jakarta.validation.Validator;
import org.modelmapper.ModelMapper;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

@Service
public class WorkspaceServiceCECompatibleImpl extends WorkspaceServiceCEImpl implements WorkspaceServiceCECompatible {
    public WorkspaceServiceCECompatibleImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            WorkspaceRepository repository,
            AnalyticsService analyticsService,
            PluginRepository pluginRepository,
            SessionUserService sessionUserService,
            AssetRepository assetRepository,
            AssetService assetService,
            ApplicationRepository applicationRepository,
            PermissionGroupService permissionGroupService,
            PolicySolution policySolution,
            ModelMapper modelMapper,
            WorkspacePermission workspacePermission,
            PermissionGroupPermission permissionGroupPermission) {
        super(
                scheduler,
                validator,
                mongoConverter,
                reactiveMongoTemplate,
                repository,
                analyticsService,
                pluginRepository,
                sessionUserService,
                assetRepository,
                assetService,
                applicationRepository,
                permissionGroupService,
                policySolution,
                modelMapper,
                workspacePermission,
                permissionGroupPermission);
    }
}
