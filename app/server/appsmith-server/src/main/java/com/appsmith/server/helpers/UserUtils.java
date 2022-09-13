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
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class UserUtils extends UserUtilsCE {

    private final CacheableRepositoryHelper cacheableRepositoryHelper;
    private final PolicyUtils policyUtils;
    private final PermissionGroupRepository permissionGroupRepository;

    private final TenantRepository tenantRepository;

    public UserUtils(ConfigRepository configRepository,
                     PermissionGroupRepository permissionGroupRepository,
                     CacheableRepositoryHelper cacheableRepositoryHelper,
                     PolicyUtils policyUtils,
                     TenantRepository tenantRepository) {

        super(configRepository, permissionGroupRepository, cacheableRepositoryHelper);
        this.cacheableRepositoryHelper = cacheableRepositoryHelper;
        this.policyUtils = policyUtils;
        this.permissionGroupRepository = permissionGroupRepository;
        this.tenantRepository = tenantRepository;
    }

    @Override
    protected Mono<Config> createInstanceConfigForSuperUser() {

        Mono<Tuple2<PermissionGroup, Config>> savedConfigAndPermissionGroupMono = createConfigAndPermissionGroupForSuperAdmin();

        // return the saved instance config
        return savedConfigAndPermissionGroupMono
                // Add tenant level permissions to the superuser role.
                .flatMap(tuple -> {
                    PermissionGroup superUserPermissionGroup = tuple.getT1();
                    Config instanceConfig = tuple.getT2();

                    // Read default tenant, add TENANT_ADMIN permission to the superuser role
                    return cacheableRepositoryHelper.getDefaultTenantId()
                            .flatMap(id -> tenantRepository.findById(id))
                            .flatMap(tenant -> {
                                Set<Permission> tenantPermissions = AppsmithRole.TENANT_ADMIN
                                        .getPermissions()
                                        .stream()
                                        .filter(aclPermission -> aclPermission.getEntity().equals(Tenant.class))
                                        .map(aclPermission -> new Permission(tenant.getId(), aclPermission))
                                        .collect(Collectors.toSet());

                                addPermissionsToPermissionGroup(superUserPermissionGroup, tenantPermissions);

                                Map<String, Policy> tenantPolicies = policyUtils
                                        .generatePolicyFromPermissionGroupForObject(superUserPermissionGroup, tenant.getId());
                                policyUtils.addPoliciesToExistingObject(tenantPolicies, tenant);

                                return Mono.zip(
                                        tenantRepository.save(tenant),
                                        permissionGroupRepository.save(superUserPermissionGroup)
                                );
                            })
                            .thenReturn(instanceConfig);
                });
    }
}
