package com.appsmith.server.constants;

import lombok.Getter;

@Getter
public enum AclPermission {

    // These are generic permissions created to make the transition to the new ACL format easy. They must be removed
    CREATE("create", null),
    READ("read", null),
    UPDATE("update", null),
    DELETE("delete", null),

    CREATE_ORGANIZATIONS("create:organizations", null),
    READ_ORGANIZATIONS("read:organizations", null),
    UPDATE_ORGANIZATIONS("update:organizations", null),
    DELETE_ORGANIZATIONS("delete:organizations", null),

    MANAGE_APPLICATIONS("manage:applications", null),
    READ_APPLICATIONS("read:applications", MANAGE_APPLICATIONS),

    CREATE_PAGES("create:pages", null),
    READ_PAGES("read:pages", CREATE_PAGES),
    UPDATE_PAGES("update:pages", null),
    DELETE_PAGES("delete:pages", null);


    private String value;
    private AclPermission parent;

    AclPermission(String value, AclPermission parent) {
        this.value = value;
    }
}
