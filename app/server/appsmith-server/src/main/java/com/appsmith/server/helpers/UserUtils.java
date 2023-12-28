package com.appsmith.server.helpers;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AppsmithRole;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.dtos.Permission;
import com.appsmith.server.helpers.ce.UserUtilsCE;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.repositories.ConfigRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.TenantRepository;
import com.appsmith.server.solutions.PermissionGroupPermission;
import com.appsmith.server.solutions.PolicySolution;
import net.minidev.json.JSONObject;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.constants.FieldName.DEFAULT_PERMISSION_GROUP;
import static com.appsmith.server.constants.FieldName.DEFAULT_USER_PERMISSION_GROUP;
import static com.appsmith.server.constants.FieldName.PROVISIONING_CONFIG;

@Component
public class UserUtils extends UserUtilsCE {

    private final CacheableRepositoryHelper cacheableRepositoryHelper;
    private final PolicySolution policySolution;
    private final PermissionGroupRepository permissionGroupRepository;
    private final TenantRepository tenantRepository;
    private final ConfigRepository configRepository;

    public UserUtils(
            ConfigRepository configRepository,
            PermissionGroupRepository permissionGroupRepository,
            CacheableRepositoryHelper cacheableRepositoryHelper,
            PolicySolution policySolution,
            TenantRepository tenantRepository,
            PermissionGroupPermission permissionGroupPermission) {

        super(configRepository, permissionGroupRepository, cacheableRepositoryHelper, permissionGroupPermission);
        this.cacheableRepositoryHelper = cacheableRepositoryHelper;
        this.policySolution = policySolution;
        this.permissionGroupRepository = permissionGroupRepository;
        this.tenantRepository = tenantRepository;
        this.configRepository = configRepository;
    }

    @Override
    protected Mono<Config> createInstanceConfigForSuperUser() {

        Mono<Tuple2<PermissionGroup, Config>> savedConfigAndPermissionGroupMono =
                createConfigAndPermissionGroupForSuperAdmin();

        // return the saved instance config
        return savedConfigAndPermissionGroupMono
                // Add tenant level permissions to the superuser role.
                .flatMap(tuple -> {
            PermissionGroup superUserPermissionGroup = tuple.getT1();
            Config instanceConfig = tuple.getT2();

            // Read default tenant, add TENANT_ADMIN permission to the superuser role
            return cacheableRepositoryHelper
                    .getDefaultTenantId()
                    .flatMap(id -> tenantRepository.findById(id))
                    .flatMap(tenant -> {
                        Set<Permission> tenantPermissions = AppsmithRole.TENANT_ADMIN.getPermissions().stream()
                                .filter(aclPermission ->
                                        aclPermission.getEntity().equals(Tenant.class))
                                .map(aclPermission -> new Permission(tenant.getId(), aclPermission))
                                .collect(Collectors.toSet());

                        addPermissionsToPermissionGroup(superUserPermissionGroup, tenantPermissions);

                        Map<String, Policy> tenantPolicies = policySolution.generatePolicyFromPermissionGroupForObject(
                                superUserPermissionGroup, tenant.getId());
                        policySolution.addPoliciesToExistingObject(tenantPolicies, tenant);

                        return Mono.zip(
                                tenantRepository.save(tenant),
                                permissionGroupRepository.save(superUserPermissionGroup));
                    })
                    .thenReturn(instanceConfig);
        });
    }

    public Mono<PermissionGroup> getDefaultUserPermissionGroup() {
        return configRepository.findByName(DEFAULT_USER_PERMISSION_GROUP).flatMap(defaultRoleConfig -> {
            JSONObject config = defaultRoleConfig.getConfig();
            String defaultPermissionGroup = (String) config.getOrDefault(DEFAULT_PERMISSION_GROUP, "");
            return permissionGroupRepository.findById(defaultPermissionGroup);
        });
    }

    public Mono<PermissionGroup> getProvisioningRole() {
        return configRepository.findByName(PROVISIONING_CONFIG).flatMap(defaultRoleConfig -> {
            JSONObject config = defaultRoleConfig.getConfig();
            String defaultPermissionGroup = (String) config.getOrDefault(DEFAULT_PERMISSION_GROUP, "");
            return permissionGroupRepository.findById(defaultPermissionGroup);
        });
    }
}
