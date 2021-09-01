package com.appsmith.external.models;

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
    
    String password;
    
    String token;
    
    String refreshToken;
    
    Object tokenResponse;
    
    String authType;
    
    DBAuth dbAuth;
    
    BasicAuth basicAuth;
    
    OAuth2 openAuth2;
    
    public DecryptedSensitiveFields(AuthenticationResponse authResponse) {
        this.token = authResponse.getToken();
        this.refreshToken = authResponse.getRefreshToken();
        this.tokenResponse = authResponse.getTokenResponse();
    }
}
