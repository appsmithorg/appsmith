package com.appsmith.external.models;

import com.fasterxml.jackson.annotation.JsonView;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class SSHConnection implements AppsmithDomain {

    public enum AuthType {
        IDENTITY_FILE, PASSWORD
    }

    @JsonView(Views.Api.class)
    String host;

    @JsonView(Views.Api.class)
    Long port;

    @JsonView(Views.Api.class)
    String username;

    @JsonView(Views.Api.class)
    AuthType authType;

    @JsonView(Views.Api.class)
    SSHPrivateKey privateKey;

}
