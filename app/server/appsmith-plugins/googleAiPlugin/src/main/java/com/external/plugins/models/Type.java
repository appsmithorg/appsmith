package com.external.plugins.models;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public enum Type {
    TEXT("text");
    private final String value;

    @Override
    public String toString() {
        return this.value;
    }
}
