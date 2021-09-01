package com.appsmith.server.domains;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import java.time.Instant;

@Data
public class GitAuth {
    @JsonIgnore
    String privateKey;

    String publicKey;

    @JsonIgnore
    Instant generatedAt;
}
