package com.appsmith.server.solutions.roles;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.solutions.roles.constants.PermissionViewableName;
import com.appsmith.server.solutions.roles.constants.RoleTab;
import com.appsmith.server.solutions.roles.dtos.BaseView;
import com.appsmith.server.solutions.roles.dtos.IdPermissionDTO;
import com.google.common.collect.Sets;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuples;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.appsmith.server.solutions.roles.constants.PermissionToViewablePermissionConstants.getPermissionViewableName;

public class HelperUtil {

    public static BaseView generateBaseViewDto(BaseDomain obj,
                                               Class clazz,
                                               String name,
                                               RoleTab roleTab,
                                               String permissionGroupId,
                                               PolicyGenerator policyGenerator) {

        BaseView baseView = new BaseView();
        baseView.setId(obj.getId());
        baseView.setName(name);
        Tuple2<List<Integer>, List<Integer>> permissionsTuple = getRoleViewPermissionDTO(roleTab, permissionGroupId, obj.getPolicies(), clazz, policyGenerator);
        baseView.setEnabled(permissionsTuple.getT1());
        baseView.setEditable(permissionsTuple.getT2());
        return baseView;
    }

    public static Tuple2<List<Integer>, List<Integer>> getRoleViewPermissionDTO(RoleTab roleTab,
                                                                                String permissionGroupId,
                                                                                Set<Policy> policies,
                                                                                Class<? extends BaseDomain> entityType,
                                                                                PolicyGenerator policyGenerator) {



        Set<AclPermission> aclPermissions = roleTab.getPermissions();
        List<PermissionViewableName> viewablePermissions = roleTab.getViewablePermissions();
        return getRoleViewPermissionDTO(permissionGroupId, entityType, policyGenerator, policies, aclPermissions, viewablePermissions);
    }

    public static Tuple2<List<Integer>, List<Integer>> getRoleViewPermissionDTO(String permissionGroupId,
                                                                                Class<? extends BaseDomain> entityType,
                                                                                PolicyGenerator policyGenerator,
                                                                                Set<Policy> policies,
                                                                                Set<AclPermission> aclPermissions,
                                                                                List<PermissionViewableName> viewablePermissions) {
        Set<PermissionViewableName> unEditablePermissions = new HashSet<>();
        Map<String, Policy> policyMap = policies.stream()
                .collect(Collectors.toMap(Policy::getPermission, Function.identity()));

        // We are using the following codes to signify various states of the checkbox in the client
        // Legend:
        // -1 - Not Applicable,
        // 0 - Disabled,
        // 1 - Enabled

        // Initialize all the permissions to be not present.
        List<Integer> enabled = new ArrayList<>(Collections.nCopies(viewablePermissions.size(), -1));
        List<Integer> editable = new ArrayList<>(Collections.nCopies(viewablePermissions.size(), -1));

        aclPermissions.stream()
                .filter(permission -> permission.getEntity().equals(entityType))
                .forEach(permission -> {
                    PermissionViewableName viewableName = getPermissionViewableName(permission);
                    int indexOfPermission = viewablePermissions.indexOf(viewableName);

                    // Disable the permission by default
                    enabled.set(indexOfPermission, 0);
                    // Make the permission editable by default
                    editable.set(indexOfPermission, 1);

                    // TODO: Remove this if condition once we have migrated all the manage entity permissions to
                    //  map the ones in RBAC.
                    if (policyMap.get(permission.getValue()) != null) {
                        Set<String> policyPermissionGroups = policyMap.get(permission.getValue()).getPermissionGroups();

                        if (policyPermissionGroups.contains(permissionGroupId)) {

                            enabled.set(indexOfPermission, 1);

                            // Get the lateral permissions for this particular permission. Those will be marked as
                            // uneditable.

                            Set<PermissionViewableName> lateralPermissions = policyGenerator.getLateralPermissions(permission, aclPermissions)
                                    .stream()
                                    .map(permission1 -> getPermissionViewableName(permission1))
                                    // Filter out the permissions not interesting for the tab
                                    .filter(viewableName1 -> viewableName1 != null && viewablePermissions.contains(viewableName1))
                                    .collect(Collectors.toSet());
                            unEditablePermissions.addAll(lateralPermissions);
                        }
                    }
                });

        unEditablePermissions.stream().forEach(permission -> {
            int indexOfPermission = viewablePermissions.indexOf(permission);
            // Set the permission to be disabled
            editable.set(indexOfPermission, 0);
        });

        return Tuples.of(enabled, editable);
    }

    public static void generateLateralPermissionDTOsAndUpdateMap(Map<AclPermission, Set<AclPermission>> hierarchicalLateralMap,
                                                                 ConcurrentHashMap<String, Set<IdPermissionDTO>> hoverMap,
                                                                 String sourceId,
                                                                 String destinationId,
                                                                 Class destinationType) {

        hierarchicalLateralMap.keySet().forEach(aclPermission -> {
            String sourceIdPermissionDto = sourceId + "_" + getPermissionViewableName(aclPermission);
            Set<IdPermissionDTO> destinationPermissions = new HashSet<>();
            hierarchicalLateralMap.get(aclPermission).stream()
                    .filter(permission -> permission.getEntity().equals(destinationType))
                    .forEach(permission -> {
                        PermissionViewableName permissionViewableName = getPermissionViewableName(permission);
                        if (permissionViewableName != null) {
                            destinationPermissions.add(new IdPermissionDTO(destinationId, permissionViewableName));
                        }
                    });
            hoverMap.merge(sourceIdPermissionDto, destinationPermissions, Sets::union);
        });
    }

    public static Map<AclPermission, Set<AclPermission>> getHierarchicalLateralPermMap(Set<AclPermission> permissions,
                                                                                       PolicyGenerator policyGenerator, RoleTab roleTab) {

        Set<AclPermission> tabPermissions = roleTab.getPermissions();

        Map<AclPermission, Set<AclPermission>> hierarchicalLateralMap = permissions.stream()
                .map(permission -> {
                    Set<AclPermission> hierarchicalPermissions = policyGenerator.getHierarchicalPermissions(permission, tabPermissions);
                    Set<AclPermission> lateralPermissions = policyGenerator.getLateralPermissions(permission, tabPermissions);
                    return Tuples.of(permission, Sets.union(hierarchicalPermissions, lateralPermissions));
                })
                .collect(Collectors.toMap(t -> t.getT1(), t -> t.getT2()));
        return hierarchicalLateralMap;
    }

}
