package com.appsmith.server.helpers;

import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.ce.WorkspaceServiceHelperCEImpl;
import com.appsmith.server.services.TenantService;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.concurrent.atomic.AtomicReference;

import static com.appsmith.server.acl.AclPermission.CREATE_WORKSPACES;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

@Component
public class WorkspaceServiceHelperImpl extends WorkspaceServiceHelperCEImpl implements WorkspaceServiceHelper {

    private final TenantService tenantService;
    private final UserUtils userUtils;

    public WorkspaceServiceHelperImpl(TenantService tenantService, UserUtils userUtils) {
        this.tenantService = tenantService;
        this.userUtils = userUtils;
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public Mono<Boolean> isCreateWorkspaceAllowed(Boolean isDefaultWorkspace) {

        if (!isDefaultWorkspace) {
            return tenantService
                    .getDefaultTenant(CREATE_WORKSPACES)
                    .map(tenant -> TRUE)
                    .switchIfEmpty(Mono.just(FALSE));
        }

        // If this is a default workspace being created, then this user is not yet logged in. We should check if
        // this user would be allowed to create a workspace if they were logged in.
        return tenantService
                .getDefaultTenant()
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
                                    });

                    return isAllowed.get();
                });
    }
}
