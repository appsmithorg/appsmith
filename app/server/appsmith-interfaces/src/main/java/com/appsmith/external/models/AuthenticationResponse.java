package com.appsmith.external.models;

import com.appsmith.external.annotations.encryption.Encrypted;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.Transient;

import java.time.Instant;

@ToString
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuthenticationResponse implements AppsmithDomain {

    @Encrypted
    String token;

    @Encrypted
    String refreshToken;

    Instant issuedAt;

    Instant expiresAt;

    @Encrypted
    Object tokenResponse;

    // This field is not returned as response by authorisation server, but is provided by cloud-services server
    @Transient
    String projectID;
}
