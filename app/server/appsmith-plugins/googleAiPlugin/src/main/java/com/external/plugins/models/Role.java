package com.external.plugins.models;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public enum Role {
    USER("user");

    private final String value;

    @Override
    public String toString() {
        return value;
    }
}
