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
    @JsonView(Views.Api.class)
    String password;
    
    @JsonView(Views.Api.class)
    String token;
    
    @JsonView(Views.Api.class)
    String refreshToken;
    
    @JsonView(Views.Api.class)
    Object tokenResponse;
    
    @JsonView(Views.Api.class)
    String authType;
    
    @JsonView(Views.Api.class)
    DBAuth dbAuth;
    
    @JsonView(Views.Api.class)
    BasicAuth basicAuth;
    
    @JsonView(Views.Api.class)
    OAuth2 openAuth2;

    @JsonView(Views.Api.class)
    BearerTokenAuth bearerTokenAuth;
    
    public DecryptedSensitiveFields(AuthenticationResponse authResponse) {
        this.token = authResponse.getToken();
        this.refreshToken = authResponse.getRefreshToken();
        this.tokenResponse = authResponse.getTokenResponse();
    }
}
