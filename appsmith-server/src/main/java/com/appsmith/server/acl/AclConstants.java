package com.appsmith.server.acl;

import java.util.Set;

public interface AclConstants {
    Set<String> PERMISSIONS_CRUD_ORG = Set.of("create:organizations");

    String GROUP_ORG_ADMIN = "org-admin";

    String DEFAULT_ORG_ID = "default-org";

    Set<String> PERMISSIONS_GROUP_ORG_ADMIN = Set.of(
            "create:organizations",
            "read:organizations",
            "create:groups",
            "read:groups",
            "create:users",
            "read:users"
    );
}

