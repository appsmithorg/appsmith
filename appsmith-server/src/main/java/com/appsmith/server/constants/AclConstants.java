package com.appsmith.server.constants;

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

    String READ_PERMISSION = "read";
    String CREATE_PERMISSION = "create";
    String DELETE_PERMISSION = "delete";
    String UPDATE_PERMISSION = "update";
    String PUBLISH_PERMISSION = "publish";
    String ARCHIVE_PERMISSION = "archive";
}

