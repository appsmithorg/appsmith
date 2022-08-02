package com.appsmith.server.domains;

import com.appsmith.server.helpers.EnumUtils;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

public enum LoginSource {
    GOOGLE, FORM, GITHUB, OIDC;

    public static LoginSource fromString(String name) {
        return EnumUtils.getEnumFromString(LoginSource.class, name);
    }

    public static Set<String> getNonFormSources() {
        return Arrays.stream(values())
                .filter(source -> source != LoginSource.FORM)
                .map(source -> source.name().toLowerCase())
                .collect(Collectors.toSet());
    }
}
