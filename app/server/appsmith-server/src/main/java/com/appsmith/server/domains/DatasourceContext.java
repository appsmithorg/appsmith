package com.appsmith.server.domains;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.Instant;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;

@Getter
@Setter
@ToString
public class DatasourceContext<T> {
    @JsonView(Views.Public.class)
    T connection;

    @JsonView(Views.Public.class)
    Instant creationTime;

    public DatasourceContext() {
        creationTime = Instant.now();
    }
}
