package com.appsmith.server.helpers;

import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.dtos.UserForManagementDTO;
import com.appsmith.server.helpers.ce.AppsmithComparatorsCE;

import java.util.Comparator;

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
}
