package com.appsmith.server.helpers;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.dtos.UserForManagementDTO;
import com.appsmith.server.helpers.ce.AppsmithComparatorsCE;

import java.util.Comparator;
import java.util.Objects;

public class AppsmithComparators extends AppsmithComparatorsCE {
    public static Comparator<UserGroup> userGroupComparator() {
        return new Comparator<>() {
            @Override
            public int compare(UserGroup ug1, UserGroup ug2) {
                return ug1.getName().compareToIgnoreCase(ug2.getName());
            }
        };
    }

    public static Comparator<UserForManagementDTO> managementUserComparator() {
        return new Comparator<>() {
            @Override
            public int compare(UserForManagementDTO user1, UserForManagementDTO user2) {
                return user1.getUsername().compareToIgnoreCase(user2.getUsername());
            }
        };
    }

    public static Comparator<PermissionGroupInfoDTO> permissionGroupInfoWithEntityTypeComparator() {
        return new Comparator<>() {
            @Override
            public int compare(PermissionGroupInfoDTO pg1, PermissionGroupInfoDTO pg2) {
                int orderForEntityType1 = getOrderForEntityType(pg1.getEntityType());
                int orderForEntityType2 = getOrderForEntityType(pg2.getEntityType());

                /*
                 * Entity Order:
                 * Workspace > Application > No Entity Type
                 */
                int permissionGroupWithEntityTypeOrder = orderForEntityType1 - orderForEntityType2;
                if (permissionGroupWithEntityTypeOrder != 0) {
                    return permissionGroupWithEntityTypeOrder;
                }

                /*
                 * Note: If the code flow comes to this line of code, then the entity type for both
                 * PermissionGroupInfoDTO is same.
                 * Due to this reasoning, there would never come a case where we end up comparing any workspace role
                 * with an application role. Hence, we can use the below naming order.
                 * Name Order:
                 * Workspace Administrator > (Workspace Developer / Application Developer) > (Workspace Viewer / Application Viewer)
                 */
                return getOrderForName(pg1.getName()) - getOrderForName(pg2.getName());
            }

            private int getOrderForEntityType(String entityType) {
                if (Objects.nonNull(entityType) && entityType.equals(Workspace.class.getSimpleName())) {
                    return 0;
                } else if (Objects.nonNull(entityType) && entityType.equals(Application.class.getSimpleName())) {
                    return 1;
                } else {
                    return 2;
                }
            }

            private int getOrderForName(String name) {
                if (Objects.nonNull(name) && name.startsWith(FieldName.ADMINISTRATOR)) {
                    return 0;
                } else if (Objects.nonNull(name) &&
                        (name.startsWith(FieldName.DEVELOPER) || name.startsWith(FieldName.APPLICATION_DEVELOPER))) {
                    return 1;
                } else if (Objects.nonNull(name) &&
                        (name.startsWith(FieldName.VIEWER) || name.startsWith(FieldName.APPLICATION_VIEWER))) {
                    return 2;
                } else {
                    return 3;
                }
            }

        };
    }

}
