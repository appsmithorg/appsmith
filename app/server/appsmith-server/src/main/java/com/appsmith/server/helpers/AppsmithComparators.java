package com.appsmith.server.helpers;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.MemberInfoDTO;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.dtos.UserForManagementDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ce.AppsmithComparatorsCE;

import java.util.Comparator;
import java.util.Objects;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;

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

    public static Comparator<PermissionGroupInfoDTO> permissionGroupInfoForWorkspaceAndApplicationMembersComparator() {
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
                int orderForRolesWithDefinedEntityType = 0;
                if (Workspace.class.getSimpleName().equals(pg1.getEntityType())) {
                    int order1 = getOrderForDefaultRoleForWorkspace(pg1);
                    int order2 = getOrderForDefaultRoleForWorkspace(pg2);
                    orderForRolesWithDefinedEntityType = order1 - order2;
                } else if (Application.class.getSimpleName().equals(pg1.getEntityType())) {
                    orderForRolesWithDefinedEntityType = pg1.getEntityName().compareToIgnoreCase(pg2.getEntityName());
                }
                if (orderForRolesWithDefinedEntityType != 0) {
                    return orderForRolesWithDefinedEntityType;
                }
                return pg1.getName().compareToIgnoreCase(pg2.getName());
            }

            private int getOrderForDefaultRoleForWorkspace(PermissionGroupInfoDTO role) {
                if (role.getName().startsWith(FieldName.ADMINISTRATOR)) {
                    return 0;
                } else if (role.getName().startsWith(FieldName.DEVELOPER)) {
                    return 1;
                } else if (role.getName().startsWith(FieldName.VIEWER)) {
                    return 2;
                }
                return 3;
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
        };
    }

    public static Comparator<MemberInfoDTO> applicationMembersComparator() {
        return new Comparator<>() {
            @Override
            public int compare(MemberInfoDTO o1, MemberInfoDTO o2) {
                /*
                 * Check if the MemberInfoDTO only contains 1 role. This is done, because we need to ensure that while
                 * getting members for a single application, the roles should contain only 1 role, i.e., application default role.
                 */
                if (CollectionUtils.isEmpty(o1.getRoles()) || o1.getRoles().size() != 1
                        || CollectionUtils.isEmpty(o2.getRoles()) || o2.getRoles().size() != 1) {
                    throw new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR);
                }

                int order1 = getOrderBasedOnApplicationRole(o1);
                int order2 = getOrderBasedOnApplicationRole(o2);

                if (order1 - order2 != 0) {
                    return order1 - order2;
                }
                if (o1.getUsername() == null || o2.getUsername() == null) {
                    return o1.getName().compareToIgnoreCase(o2.getName());
                }
                return o1.getUsername().compareToIgnoreCase(o2.getUsername());
            }

            private int getOrderBasedOnApplicationRole(MemberInfoDTO member) {
                PermissionGroupInfoDTO role = member.getRoles().get(0);
                if (Objects.nonNull(role.getName()) && role.getName().startsWith(FieldName.APPLICATION_DEVELOPER)) {
                    return 0;
                } else if (Objects.nonNull(role.getName()) && role.getName().startsWith(FieldName.APPLICATION_VIEWER)) {
                    return 1;
                }
                return 2;
            }

        };
    }

}
