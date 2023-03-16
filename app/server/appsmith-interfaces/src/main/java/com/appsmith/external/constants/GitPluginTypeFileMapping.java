package com.appsmith.external.constants;

public enum GitPluginTypeFileMapping {
    DB(".sql"),
    JS(".js"),
    SAAS(".json"),
    API(".json"),
    REMOTE(".json");

    final String value;

    GitPluginTypeFileMapping(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}