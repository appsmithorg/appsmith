package com.appsmith.server.constants;

import lombok.Getter;

@Getter
public enum AclPermission {

    // These are generic permissions created to make the transition to the new ACL format easy. They must be removed
    CREATE("create"),
    READ("read"),
    UPDATE("update"),
    DELETE("delete"),

    CREATE_APPLICATIONS("create:applications"),
    READ_APPLICATIONS("read:applications"),
    UPDATE_APPLICATIONS("update:applications"),
    DELETE_APPLICATIONS("delete:applications"),
    CREATE_ORGANIZATIONS("create:organizations"),
    READ_ORGANIZATIONS("read:organizations"),
    UPDATE_ORGANIZATIONS("update:organizations"),
    DELETE_ORGANIZATIONS("delete:organizations");

    private String value;

    AclPermission(String value) {
        this.value = value;
    }
}
