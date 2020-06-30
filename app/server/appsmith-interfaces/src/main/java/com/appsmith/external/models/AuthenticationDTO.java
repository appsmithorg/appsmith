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
public class AuthenticationDTO {

    public enum Type {
        SCRAM_SHA_1, SCRAM_SHA_256, MONGODB_CR, USERNAME_PASSWORD
    }

    Type authType;

    String username;

    String password;

    String databaseName;

}
