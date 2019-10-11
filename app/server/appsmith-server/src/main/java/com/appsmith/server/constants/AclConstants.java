package com.appsmith.server.constants;

import java.util.Set;

public interface AclConstants {
    Set<String> PERMISSIONS_CRUD_ORG = Set.of("create:organizations");

    String GROUP_ORG_ADMIN = "org-admin";
    Set<String> PERMISSIONS_GROUP_ORG_ADMIN = Set.of(
            "create:organizations",
            "read:organizations",
            "create:groups",
            "read:groups",
            "create:users",
            "read:users"
    );
}
