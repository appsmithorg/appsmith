package com.appsmith.server.helpers.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.MemberInfoDTO;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import org.apache.commons.collections.CollectionUtils;

import java.util.Comparator;
import java.util.Objects;

public class AppsmithComparatorsCE {

    public static Comparator<PermissionGroupInfoDTO> permissionGroupInfoComparator() {
        return new Comparator<>() {
            @Override
            public int compare(PermissionGroupInfoDTO pg1, PermissionGroupInfoDTO pg2) {
                return pg1.getName().compareToIgnoreCase(pg2.getName());
            }
        };
    }

    public static Comparator<MemberInfoDTO> workspaceMembersComparator() {
        return new Comparator<>() {
            @Override
            public int compare(MemberInfoDTO o1, MemberInfoDTO o2) {
                if (CollectionUtils.isEmpty(o1.getRoles()) || CollectionUtils.isEmpty(o2.getRoles())) {
                    throw new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR);
                }

                boolean workspaceRolePresent1 = o1.getRoles().stream()
                        .anyMatch(role -> Workspace.class.getSimpleName().equals(role.getEntityType()));
                boolean workspaceRolePresent2 = o1.getRoles().stream()
                        .anyMatch(role -> Workspace.class.getSimpleName().equals(role.getEntityType()));

                if (!workspaceRolePresent1 || !workspaceRolePresent2) {
                    throw new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR);
                }

                // Order based on the workspace default role (Administrator > Developer > App Viewer)
                int order1 = getOrderBasedOnWorkspaceRole(o1);
                int order2 = getOrderBasedOnWorkspaceRole(o2);

                if (order1 - order2 != 0) {
                    return order1 - order2;
                }
                if (o1.getUsername() == null || o2.getUsername() == null) {
                    return o1.getName().compareToIgnoreCase(o2.getName());
                }
                return o1.getUsername().compareToIgnoreCase(o2.getUsername());
            }

            private int getOrderBasedOnWorkspaceRole(MemberInfoDTO member) {
                PermissionGroupInfoDTO role = member.getRoles().stream()
                        .filter(role1 -> Workspace.class.getSimpleName().equals(role1.getEntityType()))
                        .findFirst()
                        .get();
                if (Objects.nonNull(role.getName()) && role.getName().startsWith(FieldName.ADMINISTRATOR)) {
                    return 0;
                } else if (Objects.nonNull(role.getName()) && role.getName().startsWith(FieldName.DEVELOPER)) {
                    return 1;
                } else if (Objects.nonNull(role.getName()) && role.getName().startsWith(FieldName.VIEWER)) {
                    return 2;
                }
                return 3;
            }
        };
    }
}
