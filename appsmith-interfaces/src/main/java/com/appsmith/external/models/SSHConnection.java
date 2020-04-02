package com.appsmith.external.models;

import lombok.*;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class SSHConnection {

    public enum AuthType {
        PrivateKey, Password
    }

    String host;

    Long port;

    String username;

    AuthType authType;

    SSHPrivateKey privateKey;

}
