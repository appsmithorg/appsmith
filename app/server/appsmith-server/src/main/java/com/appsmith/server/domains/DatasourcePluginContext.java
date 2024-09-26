package com.appsmith.server.domains;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.Instant;

@Getter
@Setter
@ToString
public class DatasourcePluginContext<T> {
    private T connection;
    private String pluginId;
    private Instant creationTime;

    public DatasourcePluginContext() {
        creationTime = Instant.now();
    }
}
