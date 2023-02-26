package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MockDataCredentials {
    String dbname;

    String username;

    String password;

    String host;

    Integer port;
}
