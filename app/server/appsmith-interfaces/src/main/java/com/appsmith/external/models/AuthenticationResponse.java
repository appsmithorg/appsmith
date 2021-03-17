package com.appsmith.external.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class AuthenticationResponse {
    String token;

    String refreshToken;

    Instant issuedAt;

    Instant expiresAt;

    Object tokenResponse;
}
