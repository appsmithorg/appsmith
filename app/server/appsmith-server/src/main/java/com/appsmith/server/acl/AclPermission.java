package com.appsmith.server.acl;

import com.appsmith.external.helpers.BaseAppsmithEnum;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.acl.ce.AclPermissionCE;
import lombok.Getter;
import lombok.Setter;

import java.lang.reflect.Modifier;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Setter
public class AclPermission extends AclPermissionCE implements BaseAppsmithEnum<AclPermission> {

    AclPermission(String value, Class<? extends BaseDomain> entity) {
        super(value, entity);
    }

    public static AclPermission getPermissionByValue(String value, Class<? extends BaseDomain> entity) {
        for (AclPermission permission : values()) {
            if (permission.getValue().equals(value) && permission.getEntity().equals(entity)) {
                return permission;
            }
        }
        return null;
    }

    public static List<AclPermission> values() {

        return Arrays.stream(AclPermission.class.getDeclaredFields())
                .filter(field -> Modifier.isStatic(field.getModifiers()))
                .map(field -> {
                    try {
                        return (AclPermission) field.get(AclPermission.class);
                    } catch (IllegalAccessException e) {
                        throw new RuntimeException(e);
                    }
                })
                .collect(Collectors.toList());
    }
}
