package com.appsmith.server.dtos;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MockDataCredentials {
    @JsonView(Views.Public.class)
    String dbname;

    @JsonView(Views.Public.class)
    String username;

    @JsonView(Views.Public.class)
    String password;

    @JsonView(Views.Public.class)
    String host;

    @JsonView(Views.Public.class)
    Integer port;
}
