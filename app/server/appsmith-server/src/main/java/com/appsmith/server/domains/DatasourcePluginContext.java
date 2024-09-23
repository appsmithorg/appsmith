package com.appsmith.server.domains;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.Instant;

@Getter
@Setter
@ToString
public class DatasourcePluginContext<T> {
    T connection;
    String pluginId;
    Instant creationTime;
}
