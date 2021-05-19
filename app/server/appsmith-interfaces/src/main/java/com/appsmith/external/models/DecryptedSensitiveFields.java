package com.appsmith.external.models;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

//This class should never be used except exporting the application as we need to export sensitive info in response
@ToString
@Getter
@Setter
@NoArgsConstructor
public class DecryptedSensitiveFields {
    String password;
    String token;
    String refreshToken;
    Object tokenResponse;

    public DecryptedSensitiveFields(AuthenticationResponse authResponse) {
        this.token = authResponse.getToken();
        this.refreshToken = authResponse.getRefreshToken();
        this.tokenResponse = authResponse.getTokenResponse();
    }
}
