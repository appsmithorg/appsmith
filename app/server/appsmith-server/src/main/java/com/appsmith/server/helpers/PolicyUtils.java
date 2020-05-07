package com.appsmith.server.helpers;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.User;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

@Component
public class PolicyUtils<T extends BaseDomain> {

    public T setUserPermissionsInObject(T obj, User user) {

        Set<String> permissions = new HashSet<>();

        for (Policy policy : obj.getPolicies()) {
            Set<String> policyUsers = policy.getUsers();
            Set<String> policyGroups = policy.getGroups();


            if (policyUsers.contains(user.getUsername())) {
                permissions.add(policy.getPermission());
            }

            for (String groupId : user.getGroupIds()) {
                if (policyGroups.contains(groupId)) {
                    permissions.add(policy.getPermission());
                    break;
                }
            }
        }

        obj.setUserPermissions(permissions);
        return obj;
    }

}
