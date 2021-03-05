package com.appsmith.external.models;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.Instant;

@ToString
@Getter
@Setter
public class AuthenticationResponse {
    String token;

    String refreshToken;

    Instant issuedAt;

    Instant expiresAt;

    Object tokenResponse;
}
