package com.appsmith.external.models;

import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
public enum PluginType {
    DB,
    API,
    JS,
    SAAS,
    REMOTE,
    AI,
    INTERNAL;

    // Add EE Plugin Types below this line, to avoid conflicts.
    public static List<Enum<?>> getPluginTypes(List<String> pluginTypes) {
        return pluginTypes.stream()
                .map(string -> {
                    if (string != null) {
                        try {
                            return Enum.valueOf(PluginType.class, string.trim());
                        } catch (IllegalArgumentException e) {
                            log.error("Invalid pluginType: {}", string);
                        }
                    }
                    return null;
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }
}
