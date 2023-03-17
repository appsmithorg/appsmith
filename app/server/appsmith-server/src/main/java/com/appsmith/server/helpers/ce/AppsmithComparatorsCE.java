package com.appsmith.server.helpers.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.dtos.MemberInfoDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.AppsmithComparators;

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
                int order1 = getOrderForMembersComparator(o1.getRoles());
                int order2 = getOrderForMembersComparator(o2.getRoles());

                // Administrator > Developer > App viewer
                int permissionGroupSortOrder = order1 - order2;

                if (permissionGroupSortOrder != 0) {
                    return permissionGroupSortOrder;
                }

                if (o1.getUsername() == null || o2.getUsername() == null)
                    return o1.getName().compareTo(o2.getName());
                return o1.getUsername().compareTo(o2.getUsername());
            }

            private int getOrderForMembersComparator(List<PermissionGroupInfoDTO> roles) {
                if (roles.isEmpty()) {
                    throw new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR);
                }
                PermissionGroupInfoDTO role = roles.get(0);
                if (role.getName().startsWith(FieldName.ADMINISTRATOR)) {
                    return 0;
                } else if (role.getName().startsWith(FieldName.DEVELOPER)) {
                    return 1;
                } else {
                    return 2;
                }
            }
        };
    }
}
