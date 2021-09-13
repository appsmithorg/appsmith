package com.appsmith.server.domains;

import com.appsmith.external.annotations.encryption.Encrypted;
import com.appsmith.external.models.AppsmithDomain;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.Instant;

@Data
public class GitAuth implements AppsmithDomain {

    @Encrypted
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    String privateKey;

    String publicKey;

    @JsonIgnore
    Instant generatedAt;
}
