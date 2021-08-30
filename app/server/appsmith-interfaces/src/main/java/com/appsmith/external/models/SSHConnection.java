package com.appsmith.external.models;

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

    String host;

    Long port;

    String username;

    AuthType authType;

    SSHPrivateKey privateKey;

}
