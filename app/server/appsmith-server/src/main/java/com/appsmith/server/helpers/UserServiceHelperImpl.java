package com.appsmith.server.helpers;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.ce.UserServiceHelperCEImpl;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.solutions.PolicySolution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@Slf4j
public class UserServiceHelperImpl extends UserServiceHelperCEImpl implements UserServiceHelper {

    private final PolicyGenerator policyGenerator;
    private final PolicySolution policySolution;
    private final TenantService tenantService;
    private final UserUtils userUtils;
    private final PermissionGroupService permissionGroupService;

    public UserServiceHelperImpl(
            PolicySolution policySolution,
            PermissionGroupService permissionGroupService,
            PolicyGenerator policyGenerator,
            TenantService tenantService,
            UserUtils userUtils) {
        super(policySolution, permissionGroupService);
        this.policyGenerator = policyGenerator;
        this.policySolution = policySolution;
        this.tenantService = tenantService;
        this.userUtils = userUtils;
        this.permissionGroupService = permissionGroupService;
    }

    /**
     * The overridden method updates policy for the user resource, where the User resource will inherit permissions
     * from the Tenant.
     * @implNote The user resource should inherit policies from the tenant at all times, and this should not fall behind
     * gac feature flag. Earlier, the migration would add those policy changes, but with 1-click, since the migrations
     * won't run, we should add these policy changes while creating the User resource.
     */
    @Override
    public Mono<User> addPoliciesToUser(User user) {
        return super.addPoliciesToUser(user)
                .zipWith(tenantService.getDefaultTenant())
                .map(pair -> {
                    User user1 = pair.getT1();
                    Tenant tenant = pair.getT2();
                    Map<String, Policy> userPoliciesMapWithNewPermissions =
                            policyGenerator.getAllChildPolicies(tenant.getPolicies(), Tenant.class, User.class).stream()
                                    .collect(Collectors.toMap(Policy::getPermission, Function.identity()));
                    policySolution.addPoliciesToExistingObject(userPoliciesMapWithNewPermissions, user1);
                    return user1;
                });
    }

    @Override
    public Mono<User> assignDefaultRoleToUser(User user) {
        return userUtils
                .getDefaultUserPermissionGroup()
                .flatMap(permissionGroup -> {
                    log.debug("Assigning default user role to newly created user {}", user.getUsername());
                    return permissionGroupService.bulkAssignToUsersWithoutPermission(permissionGroup, List.of(user));
                })
                .then(Mono.just(user));
    }
}
