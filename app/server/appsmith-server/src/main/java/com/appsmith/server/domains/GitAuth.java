package com.appsmith.server.domains;

import com.appsmith.external.annotations.encryption.Encrypted;
import com.appsmith.external.models.AppsmithDomain;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import org.springframework.data.annotation.Transient;

import java.time.Instant;

@Data
public class GitAuth implements AppsmithDomain {

    @JsonIgnore
    @Encrypted
    String privateKey;

    String publicKey;

    @JsonIgnore
    Instant generatedAt;

    // Deploy key documentation url
    @Transient
    String docUrl;
}
