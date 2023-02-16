package com.appsmith.server.solutions.roles.constants;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

import java.util.Set;

@Getter
public enum PermissionViewableName {
    /*
    Using JsonProperty to define the name of the permission as it should be displayed to the user when converted to JSON as part of server response.
    Using toString to define the name of the permission as it should be displayed while creating string concatenation in the code.
     */
    @JsonProperty("Create")
    CREATE("Create"),
    @JsonProperty("Edit")
    EDIT("Edit"),
    @JsonProperty("Delete")
    DELETE("Delete"),
    @JsonProperty("View")
    VIEW("View"),
    @JsonProperty("Make Public")
    MAKE_PUBLIC("Make Public"),
    @JsonProperty("Export")
    EXPORT("Export"),
    @JsonProperty("Execute")
    EXECUTE("Execute"),
    @JsonProperty("Invite User")
    INVITE_USER("Invite User"),
    @JsonProperty("Remove User")
    REMOVE_USER("Remove User"),
    @JsonProperty("Associate Role")
    ASSOCIATE_ROLE("Associate Role"),

    ;

    private String name;

    PermissionViewableName(String name) {
        this.name = name;
    }

    @Override
    public String toString() {
        return name;
    }

    public static Set<PermissionViewableName> getAllRoleRelatedPermission() {
        return Set.of(CREATE, EDIT, DELETE, VIEW, ASSOCIATE_ROLE);
    }

    public static Set<PermissionViewableName> getAllGroupRelatedPermission() {
        return Set.of(CREATE, EDIT, DELETE, VIEW, INVITE_USER, REMOVE_USER);
    }
}
