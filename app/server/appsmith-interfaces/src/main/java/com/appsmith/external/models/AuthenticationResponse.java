package com.appsmith.external.models;

import com.appsmith.external.annotations.encryption.Encrypted;
import com.fasterxml.jackson.annotation.JsonView;

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

    @Encrypted
    @JsonView(Views.Api.class)
    String token;

    @Encrypted
    @JsonView(Views.Api.class)
    String refreshToken;

    @JsonView(Views.Api.class)
    Instant issuedAt;

    @JsonView(Views.Api.class)
    Instant expiresAt;

    @Encrypted
    @JsonView(Views.Api.class)
    Object tokenResponse;
}
