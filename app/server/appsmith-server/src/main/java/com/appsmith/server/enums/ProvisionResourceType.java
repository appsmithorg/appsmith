package com.appsmith.server.enums;

import lombok.Getter;

@Getter
public enum ProvisionResourceType {
    USER("User"),
    GROUP("Group");

    private final String value;

    ProvisionResourceType(String value) {
        this.value = value;
    }
}
