package com.appsmith.server.services;

import com.appsmith.server.acl.RoleGraph;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.helpers.UserUtils;
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

import jakarta.validation.Validator;

import java.util.concurrent.atomic.AtomicReference;

import static com.appsmith.server.acl.AclPermission.CREATE_WORKSPACES;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

@Slf4j
@Service
public class WorkspaceServiceImpl extends WorkspaceServiceCEImpl implements WorkspaceService {

    private final TenantService tenantService;
    private final UserUtils userUtils;

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
                                TenantService tenantService,
                                UserUtils userUtils) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService,
                pluginRepository, sessionUserService, userWorkspaceService, userRepository, roleGraph,
                assetRepository, assetService, applicationRepository, permissionGroupService,
                policyUtils, modelMapper, workspacePermission, permissionGroupPermission);

        this.tenantService = tenantService;
        this.userUtils = userUtils;
    }

    @Override
    public Mono<Workspace> retrieveById(String workspaceId) {
        return repository.retrieveById(workspaceId);
    }

    @Override
    protected Mono<Boolean> isCreateWorkspaceAllowed(Boolean isDefaultWorkspace) {

        if (!isDefaultWorkspace) {
            return tenantService.getDefaultTenant(CREATE_WORKSPACES)
                    .map(tenant -> TRUE)
                    .switchIfEmpty(Mono.just(FALSE));
        }

        // If this is a default workspace being created, then this user is not yet logged in. We should check if
        // this user would be allowed to create a workspace if they were logged in.
        return tenantService.getDefaultTenant()
                .zipWith(userUtils.getDefaultUserPermissionGroup())
                .map(tuple -> {
                    Tenant tenant = tuple.getT1();
                    PermissionGroup defaultUserRole = tuple.getT2();
                    String permissionGroupId = defaultUserRole.getId();

                    // Check if the default user role has permission to create workspaces. This means that once the
                    // user has signed up, the user would also get create workspace permission via this role

                    AtomicReference<Boolean> isAllowed = new AtomicReference<>(FALSE);

                    tenant.getPolicies().stream()
                            .filter(policy -> policy.getPermission().equals(CREATE_WORKSPACES.getValue()))
                            .filter(policy -> policy.getPermissionGroups().contains(permissionGroupId))
                            .findFirst()
                            .ifPresentOrElse(
                                    policy -> {
                                        // If the default user role has permission to create workspaces, then
                                        // this user is allowed to create a workspace
                                        policy.getPermissionGroups().stream()
                                                .filter(id -> id.equals(permissionGroupId))
                                                .findFirst()
                                                .ifPresent(id -> isAllowed.set(TRUE));
                                    },
                                    () -> {
                                        // Since this policy itself doesn't exist, the user is not allowed to
                                        isAllowed.set(FALSE);
                                    }
                            );

                    return isAllowed.get();
                });
    }

}
