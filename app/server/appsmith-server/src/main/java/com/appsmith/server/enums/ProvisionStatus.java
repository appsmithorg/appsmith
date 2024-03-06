package com.appsmith.server.enums;

import lombok.Getter;

@Getter
public enum ProvisionStatus {
    ACTIVE("active"),
    INACTIVE("inactive"),
    ;

    private final String value;

    ProvisionStatus(String value) {
        this.value = value;
    }
}
