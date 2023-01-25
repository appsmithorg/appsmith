package com.appsmith.server.dtos;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MockDataCredentials {
    @JsonView(Views.Api.class)
    String dbname;

    @JsonView(Views.Api.class)
    String username;

    @JsonView(Views.Api.class)
    String password;

    @JsonView(Views.Api.class)
    String host;

    @JsonView(Views.Api.class)
    Integer port;
}
