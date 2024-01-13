package com.appsmith.server.helpers.ce;

import com.appsmith.external.models.Policy;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.Permission;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.solutions.PolicySolution;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.MANAGE_USERS;

@Component
@AllArgsConstructor
public class UserServiceHelperCEImpl implements UserServiceHelperCE {

    private final PolicySolution policySolution;
    private final PermissionGroupService permissionGroupService;

    @Override
    public Mono<User> addPoliciesToUser(User user) {
        // Create user management permission group
        PermissionGroup userManagementPermissionGroup = new PermissionGroup();
        userManagementPermissionGroup.setName(user.getUsername() + FieldName.SUFFIX_USER_MANAGEMENT_ROLE);
        // Add CRUD permissions for user to the group
        userManagementPermissionGroup.setPermissions(Set.of(new Permission(user.getId(), MANAGE_USERS)));
        userManagementPermissionGroup.setDefaultDomainType(User.class.getSimpleName());
        userManagementPermissionGroup.setDefaultDomainId(user.getId());

        // Assign the permission group to the user
        userManagementPermissionGroup.setAssignedToUserIds(Set.of(user.getId()));

        return permissionGroupService.save(userManagementPermissionGroup).map(savedPermissionGroup -> {
            Map<String, Policy> crudUserPolicies =
                    policySolution.generatePolicyFromPermissionGroupForObject(savedPermissionGroup, user.getId());

            User updatedWithPolicies = policySolution.addPoliciesToExistingObject(crudUserPolicies, user);

            return updatedWithPolicies;
        });
    }
}
