package com.appsmith.server.domains;

import com.appsmith.external.annotations.encryption.Encrypted;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import java.time.Instant;

@Data
public class GitAuth {
    @JsonIgnore
    @Encrypted
    String privateKey;

    String publicKey;

    @JsonIgnore
    Instant generatedAt;
}
