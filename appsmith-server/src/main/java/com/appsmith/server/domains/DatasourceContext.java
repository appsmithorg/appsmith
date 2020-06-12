package com.appsmith.server.domains;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.Instant;

@Getter
@Setter
@ToString
public class DatasourceContext {
    Object connection;

    Instant creationTime;

    public DatasourceContext() {
        creationTime = Instant.now();
    }
}
