package com.appsmith.server.helpers;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.domains.User;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class PolicyUtils<T extends BaseDomain> {

    private final PolicyGenerator policyGenerator;

    public PolicyUtils(PolicyGenerator policyGenerator) {
        this.policyGenerator = policyGenerator;
    }

    public T setUserPermissionsInObject(T obj, User user) {

        Set<String> permissions = new HashSet<>();

        for (Policy policy : obj.getPolicies()) {
            Set<String> policyUsers = policy.getUsers();
            Set<String> policyGroups = policy.getGroups();


            if (policyUsers != null && policyUsers.contains(user.getUsername())) {
                permissions.add(policy.getPermission());
            }

            if (user.getGroupIds() != null) {
                for (String groupId : user.getGroupIds()) {
                    if (policyGroups != null && policyGroups.contains(groupId)) {
                        permissions.add(policy.getPermission());
                        break;
                    }
                }
            }
        }

        obj.setUserPermissions(permissions);
        return obj;
    }

    public T generateAndAddPoliciesFromPermissions(Set<AclPermission> permissions, T obj, User user) {
        Map<String, Policy> policyMap = generatePolicyFromPermission(permissions, user);

        // Append the user to the existing permission policy if it already exists.
        for (Policy policy : obj.getPolicies()) {
            String permission = policy.getPermission();
            if (policyMap.containsKey(permission)) {
                policy.getUsers().addAll(policyMap.get(permission).getUsers());
                if (policy.getGroups() == null) {
                    policy.setGroups(new HashSet<>());
                }
                if (policyMap.get(permission).getGroups() != null) {
                    policy.getGroups().addAll(policyMap.get(permission).getGroups());
                }
                // Remove this permission from the policyMap as this has been accounted for in the above code
                policyMap.remove(permission);
            }
        }

        obj.getPolicies().addAll(policyMap.values());
        return obj;
    }

    public T generateAndRemovePolicies(Set<AclPermission> permissions, T obj, User user) {
        Map<String, Policy> policyMap = generatePolicyFromPermission(permissions, user);

        // Remove the user from the existing permission policy if it exists.
        for (Policy policy : obj.getPolicies()) {
            String permission = policy.getPermission();
            if (policyMap.containsKey(permission)) {
                policy.getUsers().removeAll(policyMap.get(permission).getUsers());
                if (policy.getGroups() == null) {
                    policy.setGroups(new HashSet<>());
                }
                if (policyMap.get(permission).getGroups() != null) {
                    policy.getGroups().removeAll(policyMap.get(permission).getGroups());
                }
                // Remove this permission from the policyMap as this has been accounted for in the above code
                policyMap.remove(permission);
            }
        }

        return obj;
    }

    /**
     * Given a set of AclPermissions, generate all policies (including policies from lateral permissions) for the user.
     * @param permissions
     * @param user
     * @return
     */
    private Map<String, Policy> generatePolicyFromPermission(Set<AclPermission> permissions, User user) {
        return permissions.stream()
                .map(perm -> {
                    // Create a policy for the invited user using the permission as per the role
                    Policy policyWithCurrentPermission = Policy.builder().permission(perm.getValue())
                            .users(Set.of(user.getUsername())).build();
                    // Generate any and all lateral policies that might come with the current permission
                    Set<Policy> policiesForUser = policyGenerator.getLateralPoliciesForUser(perm, user);
                    policiesForUser.add(policyWithCurrentPermission);
                    return policiesForUser;
                })
                .flatMap(Collection::stream)
                .collect(Collectors.toMap(Policy::getPermission, Function.identity()));
    }

}
