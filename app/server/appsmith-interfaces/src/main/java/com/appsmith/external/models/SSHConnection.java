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

    // Use the SSHAuth class for authentication.
    SSHAuth authentication;

    // Add any other fields required to define an SSH proxy

}
