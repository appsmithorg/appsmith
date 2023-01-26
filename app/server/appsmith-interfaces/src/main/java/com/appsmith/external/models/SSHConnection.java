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

    @JsonView(Views.Public.class)
    String host;

    @JsonView(Views.Public.class)
    Long port;

    @JsonView(Views.Public.class)
    String username;

    @JsonView(Views.Public.class)
    AuthType authType;

    @JsonView(Views.Public.class)
    SSHPrivateKey privateKey;

}
