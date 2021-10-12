package com.appsmith.server.domains;

import com.appsmith.server.helpers.EnumUtils;

public enum LoginSource {
    GOOGLE, FORM, GITHUB, KEYCLOAK;

    public static LoginSource fromString(String name) {
        return EnumUtils.getEnumFromString(LoginSource.class, name);
    }
}
