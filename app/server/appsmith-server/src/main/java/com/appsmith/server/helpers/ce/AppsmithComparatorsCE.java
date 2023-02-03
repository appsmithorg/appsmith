package com.appsmith.server.helpers.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.dtos.WorkspaceMemberInfoDTO;

import java.util.Comparator;

public class AppsmithComparatorsCE {

    public static Comparator<PermissionGroupInfoDTO> permissionGroupInfoComparator() {
        return new Comparator<>() {
            @Override
            public int compare(PermissionGroupInfoDTO pg1, PermissionGroupInfoDTO pg2) {
                return pg1.getName().compareToIgnoreCase(pg2.getName());
            }
        };
    }

    public static Comparator<WorkspaceMemberInfoDTO> getWorkspaceMemberComparator() {
        return new Comparator<>() {
            @Override
            public int compare(WorkspaceMemberInfoDTO o1, WorkspaceMemberInfoDTO o2) {
                int order1 = getOrder(o1.getPermissionGroupName());
                int order2 = getOrder(o2.getPermissionGroupName());

                // Administrator > Developer > App viewer
                int permissionGroupSortOrder = order1 - order2;

                if (permissionGroupSortOrder != 0) {
                    return permissionGroupSortOrder;
                }

                if (o1.getUsername() == null || o2.getUsername() == null)
                    return o1.getName().compareTo(o2.getName());
                return o1.getUsername().compareTo(o2.getUsername());
            }

            private int getOrder(String name) {
                if (name.startsWith(FieldName.ADMINISTRATOR)) {
                    return 0;
                } else if (name.startsWith(FieldName.DEVELOPER)) {
                    return 1;
                } else {
                    return 2;
                }
            }
        };
    }
}
