package com.appsmith.external.models;

import com.appsmith.external.annotations.documenttype.DocumentType;
import com.appsmith.external.annotations.encryption.Encrypted;
import com.appsmith.external.constants.Authentication;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

/**
 * This class defines the fields required for SSH authentication. Will be used in the SSH plugin and also for SSH
 * tunneling for other databse or HTTP connections. See {@link SSHConnection} for details on the proxy
 */
@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@DocumentType(Authentication.SSH)
public class SSHAuth extends AuthenticationDTO {
    public enum AuthType {
        IDENTITY_FILE, PASSWORD
    }

    String host;

    Long port;

    String username;

    @Encrypted
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    String password;

    SSHAuth.AuthType authType;

    SSHPrivateKey privateKey;
}
