package com.appsmith.server.acl;

import com.appsmith.external.helpers.BaseAppsmithEnum;
import com.appsmith.server.acl.ce.AppsmithRoleCE;
import lombok.Getter;

import java.lang.reflect.Modifier;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Getter
public class AppsmithRole extends AppsmithRoleCE implements BaseAppsmithEnum<AppsmithRole> {

    private Set<AclPermission> permissions;
    private String name;
    private String description;

    public AppsmithRole(String name, String description, Set<AclPermission> permissions) {
        super(name, description, permissions);
        this.name = name;
        this.description = description;
        this.permissions = permissions;
    }

    public static List<AppsmithRole> values() {

        return Arrays.stream(AppsmithRole.class.getDeclaredFields())
                .filter(field -> Modifier.isStatic(field.getModifiers()))
                .map(field -> {
                    try {
                        return (AppsmithRole) field.get(AppsmithRole.class);
                    } catch (IllegalAccessException e) {
                        throw new RuntimeException(e);
                    }
                })
                .collect(Collectors.toList());
    }

    public static AppsmithRole generateAppsmithRoleFromName(String name) {
        List<AppsmithRole> appsmithRoles = AppsmithRole.values();
        for (AppsmithRole role : appsmithRoles) {
            if (role.getName().equals(name)) {
                return role;
            }
        }
        return null;
    }
}
