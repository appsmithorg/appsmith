package com.appsmith.external.models;

import com.appsmith.external.annotations.documenttype.DocumentType;
import com.appsmith.external.annotations.encryption.Encrypted;
import com.appsmith.external.constants.Authentication;
import com.appsmith.external.views.FromRequest;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@DocumentType(Authentication.DB_AUTH)
public class DBAuth extends AuthenticationDTO {

    public enum Type {
        SCRAM_SHA_1,
        SCRAM_SHA_256,
        MONGODB_CR,
        USERNAME_PASSWORD
    }

    @JsonView({Views.Public.class, FromRequest.class})
    Type authType;

    @JsonView({Views.Public.class, FromRequest.class})
    String username;

    @Encrypted @JsonView(FromRequest.class)
    String password;

    @JsonView({Views.Public.class, FromRequest.class})
    String databaseName;
}
