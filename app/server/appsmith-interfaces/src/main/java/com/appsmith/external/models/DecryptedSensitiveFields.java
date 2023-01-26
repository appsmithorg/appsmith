package com.appsmith.external.models;

import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

/**
 * This class hold sensitive information, and fields that have a `@JsonIgnore` on them, so that such information
 * can be serialized when an application is exported.
 */
@ToString
@Getter
@Setter
@NoArgsConstructor
public class DecryptedSensitiveFields {
    @JsonView(Views.Public.class)
    String password;
    
    @JsonView(Views.Public.class)
    String token;
    
    @JsonView(Views.Public.class)
    String refreshToken;
    
    @JsonView(Views.Public.class)
    Object tokenResponse;
    
    @JsonView(Views.Public.class)
    String authType;
    
    @JsonView(Views.Public.class)
    DBAuth dbAuth;
    
    @JsonView(Views.Public.class)
    BasicAuth basicAuth;
    
    @JsonView(Views.Public.class)
    OAuth2 openAuth2;

    @JsonView(Views.Public.class)
    BearerTokenAuth bearerTokenAuth;
    
    public DecryptedSensitiveFields(AuthenticationResponse authResponse) {
        this.token = authResponse.getToken();
        this.refreshToken = authResponse.getRefreshToken();
        this.tokenResponse = authResponse.getTokenResponse();
    }
}
