package com.appsmith.external.models;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.time.Instant;

@ToString
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuthenticationResponse implements AppsmithDomain {
    String token;

    String refreshToken;

    Instant issuedAt;

    Instant expiresAt;

    Object tokenResponse;
}
