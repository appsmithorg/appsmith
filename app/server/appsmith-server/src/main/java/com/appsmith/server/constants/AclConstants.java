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

    String READ_APPLICATION_PERMISSION = "read:applications";
    String CREATE_APPLICATION_PERMISSION = "create:applications";
    String DELETE_APPLICATION_PERMISSION = "delete:applications";
    String UPDATE_APPLICATION_PERMISSION = "update:applications";
    String PUBLISH_APPLICATION_PERMISSION = "publish:applications";
}
