package com.appsmith.external.models;

import com.fasterxml.jackson.annotation.JsonProperty;
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

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    String password;

    String databaseName;

}
