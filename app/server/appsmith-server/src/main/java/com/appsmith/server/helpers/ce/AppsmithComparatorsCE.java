package com.appsmith.server.helpers.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.dtos.MemberInfoDTO;
import com.appsmith.server.dtos.ce.AutoCreatedRoleInfo;

import java.util.Comparator;
import java.util.List;

public class AppsmithComparatorsCE {

    public static Comparator<PermissionGroupInfoDTO> permissionGroupInfoComparator() {
        return new Comparator<>() {
            @Override
            public int compare(PermissionGroupInfoDTO pg1, PermissionGroupInfoDTO pg2) {
                return pg1.getName().compareToIgnoreCase(pg2.getName());
            }
        };
    }

    public static Comparator<MemberInfoDTO> getWorkspaceMemberComparator() {
        return new Comparator<>() {
            @Override
            public int compare(MemberInfoDTO o1, MemberInfoDTO o2) {
                int order1 = getOrder(o1.getRoles());
                int order2 = getOrder(o2.getRoles());

                // Administrator > Developer > App viewer
                int permissionGroupSortOrder = order1 - order2;

                if (permissionGroupSortOrder != 0) {
                    return permissionGroupSortOrder;
                }

                if (o1.getUsername() == null || o2.getUsername() == null)
                    return o1.getName().compareTo(o2.getName());
                return o1.getUsername().compareTo(o2.getUsername());
            }

            private int getOrder(List<AutoCreatedRoleInfo> autoCreatedRoleInfoList) {
                if (autoCreatedRoleInfoList.stream().anyMatch(role -> role.getName().startsWith(FieldName.ADMINISTRATOR))) {
                    return 0;
                } else if (autoCreatedRoleInfoList.stream().anyMatch(role -> role.getName().startsWith(FieldName.DEVELOPER))) {
                    return 1;
                } else {
                    return 2;
                }
            }
        };
    }
}
