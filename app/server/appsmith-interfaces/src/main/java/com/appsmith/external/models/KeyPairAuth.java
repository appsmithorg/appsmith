package com.appsmith.external.models;

import com.appsmith.external.annotations.documenttype.DocumentType;
import com.appsmith.external.annotations.encryption.Encrypted;
import com.appsmith.external.constants.Authentication;
import com.appsmith.external.views.FromRequest;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Builder
@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@DocumentType(Authentication.SNOWFLAKE_KEY_PAIR_AUTH)
public class KeyPairAuth extends AuthenticationDTO {

    @JsonView({Views.Public.class, FromRequest.class})
    String username;

    @JsonView({Views.Public.class, FromRequest.class})
    UploadedFile privateKey;

    @JsonView({Views.Internal.class, FromRequest.class})
    @Encrypted String passphrase;
}
