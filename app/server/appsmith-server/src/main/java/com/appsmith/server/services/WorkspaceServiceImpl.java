package com.appsmith.server.services;

import com.appsmith.server.acl.RoleGraph;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.AssetRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.ce.WorkspaceServiceCEImpl;
import com.appsmith.server.solutions.PermissionGroupPermission;
import com.appsmith.server.solutions.WorkspacePermission;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;

@Slf4j
@Service
public class WorkspaceServiceImpl extends WorkspaceServiceCEImpl implements WorkspaceService {

    private final TenantService tenantService;

    public WorkspaceServiceImpl(Scheduler scheduler,
                                Validator validator,
                                MongoConverter mongoConverter,
                                ReactiveMongoTemplate reactiveMongoTemplate,
                                WorkspaceRepository repository,
                                AnalyticsService analyticsService,
                                PluginRepository pluginRepository,
                                SessionUserService sessionUserService,
                                UserWorkspaceService userWorkspaceService,
                                UserRepository userRepository,
                                RoleGraph roleGraph,
                                AssetRepository assetRepository,
                                AssetService assetService,
                                ApplicationRepository applicationRepository,
                                PermissionGroupService permissionGroupService,
                                PolicyUtils policyUtils,
                                ModelMapper modelMapper,
                                WorkspacePermission workspacePermission,
                                PermissionGroupPermission permissionGroupPermission,
                                TenantService tenantService) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService,
                pluginRepository, sessionUserService, userWorkspaceService, userRepository, roleGraph,
                assetRepository, assetService, applicationRepository, permissionGroupService,
                policyUtils, modelMapper, workspacePermission, permissionGroupPermission);

        this.tenantService = tenantService;
    }

    @Override
    public Mono<Workspace> retrieveById(String workspaceId) {
        return repository.retrieveById(workspaceId);
    }

//    @Override
//    protected Mono<Boolean> isCreateWorkspaceAllowed() {
//
//        return tenantService.getDefaultTenant(CREATE_WORKSPACES)
//                .map(tenant -> TRUE)
//                .switchIfEmpty(Mono.just(FALSE));
//    }

}
